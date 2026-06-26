package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// ─── Constants ────────────────────────────────────────────────────────────────

const (
	Port              = ":8080"
	FrontendDir       = "../frontend"
	DBPath            = "../data/elaris.db"
	AdminPassphrase   = "admin0001"
	AdminSessionToken = "ElarisSessionToken2026"
)

// ─── Session model ────────────────────────────────────────────────────────────

type Session struct {
	ID           string          `json:"id"`
	UserID       string          `json:"user_id"`
	PlayerName   string          `json:"player_name"`
	PlayerRole   string          `json:"player_role"`
	PlayerIcon   string          `json:"player_icon"`
	Score        int             `json:"score"`
	ModuleIdx    int             `json:"module_idx"`
	ModuleScores json.RawMessage `json:"module_scores"`
	Domains      json.RawMessage `json:"domains"`
	Fragments    json.RawMessage `json:"fragments"`
	DASS         json.RawMessage `json:"dass"`
	DASSRaw      json.RawMessage `json:"dass_raw"`
	RTSamples    json.RawMessage `json:"rt_samples"`
	ClickDensity json.RawMessage `json:"click_density"`
	CorrectCount int             `json:"correct_count"`
	AttemptCount int             `json:"attempt_count"`
	Murderer     string          `json:"murderer"`
	MurdererName string          `json:"murderer_name"`
	KillerGuess  string          `json:"killer_guess"`
	SessionStart int64           `json:"session_start"`
	LastUpdated  int64           `json:"last_updated"`
	UserEmail    string          `json:"user_email"`
}

// ─── Global DB handle ─────────────────────────────────────────────────────────

var db *sql.DB

// ─── Helpers ──────────────────────────────────────────────────────────────────

// rawOrDefault returns the stored string as json.RawMessage, falling back to
// the provided default literal when the stored value is empty or null.
func rawOrDefault(stored string, def string) json.RawMessage {
	if stored == "" || stored == "null" {
		return json.RawMessage(def)
	}
	return json.RawMessage(stored)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

// ─── CORS middleware ──────────────────────────────────────────────────────────

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ─── Database init ────────────────────────────────────────────────────────────

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", DBPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1) // sqlite3 prefers single writer

	schema := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id       TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			age      INTEGER,
			identity TEXT,
			progress TEXT DEFAULT '{}',
			email    TEXT DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id             TEXT    PRIMARY KEY,
			user_id        TEXT    NOT NULL DEFAULT '',
			player_name    TEXT    NOT NULL DEFAULT '',
			player_role    TEXT    NOT NULL DEFAULT '',
			player_icon    TEXT    NOT NULL DEFAULT '',
			score          INTEGER NOT NULL DEFAULT 0,
			module_idx     INTEGER NOT NULL DEFAULT 0,
			module_scores  TEXT    NOT NULL DEFAULT '[]',
			domains        TEXT    NOT NULL DEFAULT '{}',
			fragments      TEXT    NOT NULL DEFAULT '[]',
			dass           TEXT    NOT NULL DEFAULT '{}',
			dass_raw       TEXT    NOT NULL DEFAULT '[]',
			rt_samples     TEXT    NOT NULL DEFAULT '[]',
			click_density  TEXT    NOT NULL DEFAULT '[]',
			correct_count  INTEGER NOT NULL DEFAULT 0,
			attempt_count  INTEGER NOT NULL DEFAULT 0,
			murderer       TEXT    NOT NULL DEFAULT '',
			murderer_name  TEXT    NOT NULL DEFAULT '',
			killer_guess   TEXT    NOT NULL DEFAULT '',
			session_start  INTEGER NOT NULL DEFAULT 0,
			last_updated   INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(last_updated DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id)`,
	}

	for _, stmt := range schema {
		if _, err := db.Exec(stmt); err != nil {
			log.Fatalf("schema exec: %v\nSQL: %s", err, stmt)
		}
	}

	// Safe ALTER TABLE – add click_density column if it does not yet exist.
	// Ignore the error if the column is already present.
	_, _ = db.Exec(`ALTER TABLE sessions ADD COLUMN click_density TEXT NOT NULL DEFAULT '[]'`)
	_, _ = db.Exec(`ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''`)

	log.Println("✔  Database initialised:", DBPath)
}

// ─── /api/health ──────────────────────────────────────────────────────────────

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var count int
	_ = db.QueryRow(`SELECT COUNT(*) FROM sessions`).Scan(&count)
	writeJSON(w, http.StatusOK, map[string]any{
		"status":         "ok",
		"time":           time.Now().UTC().Format(time.RFC3339),
		"sessions_count": count,
	})
}

// Helper to get identity display name
func getIdentityName(id string) string {
	switch id {
	case "ceo":
		return "CEO"
	case "doctor":
		return "Doctor"
	case "influencer":
		return "Influencer"
	case "musician":
		return "Musician"
	case "comedian":
		return "Comedian"
	case "academic":
		return "Academic"
	case "therapist":
		return "Therapist"
	case "detective":
		return "Detective"
	case "gamer":
		return "Gamer"
	}
	if len(id) == 0 {
		return "Traveller"
	}
	r := []rune(id)
	if r[0] >= 'a' && r[0] <= 'z' {
		r[0] = r[0] - 'a' + 'A'
	}
	return string(r)
}

// ─── /api/register ────────────────────────────────────────────────────────────

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		Username     string `json:"username"`
		Password     string `json:"password"`
		Name         string `json:"name"`
		Passphrase   string `json:"passphrase"`
		Age          int    `json:"age"`
		Identity     string `json:"identity"`
		IdentityName string `json:"identityName"`
		Email        string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	username := body.Username
	if username == "" {
		username = body.Name
	}
	password := body.Password
	if password == "" {
		password = body.Passphrase
	}

	if username == "" || password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username and password/passphrase required"})
		return
	}

	userID := fmt.Sprintf("u_%d", time.Now().UnixNano())
	_, err := db.Exec(
		`INSERT INTO users (id, username, password, age, identity, email) VALUES (?, ?, ?, ?, ?, ?)`,
		userID, username, password, body.Age, body.Identity, body.Email,
	)
	if err != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "username already taken"})
		return
	}

	identityName := body.IdentityName
	if identityName == "" {
		identityName = getIdentityName(body.Identity)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":           userID,
		"user_id":      userID,
		"name":         username,
		"username":     username,
		"age":          body.Age,
		"identity":     body.Identity,
		"identityName": identityName,
		"email":        body.Email,
		"status":       "registered",
	})
}

// ─── /api/login ───────────────────────────────────────────────────────────────

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		Username   string `json:"username"`
		Password   string `json:"password"`
		Name       string `json:"name"`
		Passphrase string `json:"passphrase"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	username := body.Username
	if username == "" {
		username = body.Name
	}
	password := body.Password
	if password == "" {
		password = body.Passphrase
	}

	if username == "" || password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username and password/passphrase required"})
		return
	}

	row := db.QueryRow(
		`SELECT id, username, age, identity FROM users WHERE username = ? AND password = ?`,
		username, password,
	)
	var userID, dbUsername string
	var age sql.NullInt64
	var identity sql.NullString
	if err := row.Scan(&userID, &dbUsername, &age, &identity); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	identityVal := identity.String
	identityNameVal := getIdentityName(identityVal)

	writeJSON(w, http.StatusOK, map[string]any{
		"id":           userID,
		"user_id":      userID,
		"name":         dbUsername,
		"username":     dbUsername,
		"age":          age.Int64,
		"identity":     identityVal,
		"identityName": identityNameVal,
		"status":       "logged_in",
	})
}

// ─── /api/update-identity ─────────────────────────────────────────────────────

func handleUpdateIdentity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		UserID       string `json:"user_id"`
		Identity     string `json:"identity"`
		IdentityName string `json:"identityName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if body.UserID == "" || body.Identity == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "user_id and identity required"})
		return
	}

	identityName := body.IdentityName
	if identityName == "" {
		identityName = getIdentityName(body.Identity)
	}

	_, err := db.Exec(
		`UPDATE users SET identity = ? WHERE id = ?`,
		body.Identity, body.UserID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":       "identity_updated",
		"identity":     body.Identity,
		"identityName": identityName,
	})
}

// ─── /api/user/progress ───────────────────────────────────────────────────────

func handleUserProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		UserID   string          `json:"userId"`
		Progress json.RawMessage `json:"progress"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if body.UserID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "userId required"})
		return
	}
	progressStr := "{}"
	if len(body.Progress) > 0 {
		progressStr = string(body.Progress)
	}
	_, err := db.Exec(
		`UPDATE users SET progress = ? WHERE id = ?`,
		progressStr, body.UserID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Retrieve real username to keep sessions table in sync with account name
	var username string
	err = db.QueryRow(`SELECT username FROM users WHERE id = ?`, body.UserID).Scan(&username)
	if err != nil {
		username = body.UserID // fallback if query fails
	}

	// Extract and synchronize sessions table
	var cp struct {
		Player struct {
			Name string `json:"name"`
			Role string `json:"role"`
			Icon string `json:"icon"`
		} `json:"player"`
		Score        int             `json:"score"`
		ModuleIdx    int             `json:"moduleIdx"`
		ModuleScores json.RawMessage `json:"moduleScores"`
		Domains      json.RawMessage `json:"domains"`
		Fragments    json.RawMessage `json:"fragments"`
		DASS         json.RawMessage `json:"dass"`
		DASSRaw      json.RawMessage `json:"dassRaw"`
		RTSamples    json.RawMessage `json:"rtSamples"`
		CorrectCount int             `json:"correctCount"`
		AttemptCount int             `json:"attemptCount"`
		Murderer     string          `json:"murderer"`
		KillerGuess  string          `json:"killerGuess"`
		SessionStart int64           `json:"sessionStart"`
		LastUpdated  int64           `json:"lastUpdated"`
	}
	if err := json.Unmarshal(body.Progress, &cp); err != nil {
		log.Printf("Error unmarshaling progress telemetry for user %s: %v", body.UserID, err)
	} else {
		sessStart := cp.SessionStart
		if sessStart > 9999999999 {
			sessStart = sessStart / 1000
		}
		lastUpd := cp.LastUpdated
		if lastUpd > 9999999999 {
			lastUpd = lastUpd / 1000
		}
		if lastUpd == 0 {
			lastUpd = time.Now().Unix()
		}

		sessID := body.UserID
		if sessStart > 0 {
			sessID = fmt.Sprintf("%s_%d", body.UserID, sessStart)
		}
		
		murdererName := ""
		if cp.Murderer != "" {
			mNames := map[string]string{
				"doctor":     "Dr. Avery Ross",
				"ceo":        "Marcus Hale",
				"musician":   "Lena Brooks",
				"student":    "Noah Mercer",
				"comedian":   "Ethan Cross",
				"detective":  "Oliver Grant",
				"therapist":  "Maya Singh",
				"gamer":      "Daniel Price",
				"influencer": "Sarah Bennett",
				"rachel":     "Rachel Quinn",
				"rowan":      "Rowan Ashford",
			}
			murdererName = mNames[cp.Murderer]
		}

		_, err := db.Exec(`
			INSERT OR REPLACE INTO sessions (
				id, user_id, player_name, player_role, player_icon,
				score, module_idx, module_scores, domains, fragments,
				dass, dass_raw, rt_samples, click_density,
				correct_count, attempt_count,
				murderer, murderer_name, killer_guess,
				session_start, last_updated
			) VALUES (
				?, ?, ?, ?, ?,
				?, ?, ?, ?, ?,
				?, ?, ?, ?,
				?, ?,
				?, ?, ?,
				?, ?
			)`,
			sessID, body.UserID, username, cp.Player.Role, cp.Player.Icon,
			cp.Score, cp.ModuleIdx,
			string(rawOrDefault(string(cp.ModuleScores), "[]")),
			string(rawOrDefault(string(cp.Domains), "{}")),
			string(rawOrDefault(string(cp.Fragments), "[]")),
			string(rawOrDefault(string(cp.DASS), "{}")),
			string(rawOrDefault(string(cp.DASSRaw), "[]")),
			string(rawOrDefault(string(cp.RTSamples), "[]")),
			"[]", // click_density default
			cp.CorrectCount, cp.AttemptCount,
			cp.Murderer, murdererName, cp.KillerGuess,
			sessStart, lastUpd,
		)
		if err != nil {
			log.Printf("Error inserting/replacing session in database for user %s: %v", body.UserID, err)
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// ─── /api/session (POST / PUT) ────────────────────────────────────────────────

func handleUpsertSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var s Session
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if s.ID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "session id required"})
		return
	}
	if s.LastUpdated == 0 {
		s.LastUpdated = time.Now().Unix()
	}

	_, err := db.Exec(`
		INSERT OR REPLACE INTO sessions (
			id, user_id, player_name, player_role, player_icon,
			score, module_idx, module_scores, domains, fragments,
			dass, dass_raw, rt_samples, click_density,
			correct_count, attempt_count,
			murderer, murderer_name, killer_guess,
			session_start, last_updated
		) VALUES (
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?,
			?, ?,
			?, ?, ?,
			?, ?
		)`,
		s.ID, s.UserID, s.PlayerName, s.PlayerRole, s.PlayerIcon,
		s.Score, s.ModuleIdx,
		string(rawOrDefault(string(s.ModuleScores), "[]")),
		string(rawOrDefault(string(s.Domains), "{}")),
		string(rawOrDefault(string(s.Fragments), "[]")),
		string(rawOrDefault(string(s.DASS), "{}")),
		string(rawOrDefault(string(s.DASSRaw), "[]")),
		string(rawOrDefault(string(s.RTSamples), "[]")),
		string(rawOrDefault(string(s.ClickDensity), "[]")),
		s.CorrectCount, s.AttemptCount,
		s.Murderer, s.MurdererName, s.KillerGuess,
		s.SessionStart, s.LastUpdated,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "saved", "id": s.ID})
}

// ─── /api/session (GET) ───────────────────────────────────────────────────────

func handleGetSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id param required"})
		return
	}
	row := db.QueryRow(`SELECT
		s.id, s.user_id, s.player_name, s.player_role, s.player_icon,
		s.score, s.module_idx, s.module_scores, s.domains, s.fragments,
		s.dass, s.dass_raw, s.rt_samples, s.click_density,
		s.correct_count, s.attempt_count,
		s.murderer, s.murderer_name, s.killer_guess,
		s.session_start, s.last_updated,
		COALESCE(u.email, '') AS user_email
		FROM sessions s
		LEFT JOIN users u ON s.user_id = u.id
		WHERE s.id = ?`, id)

	s, err := scanSession(row)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "session not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// ─── /api/session (DELETE) ────────────────────────────────────────────────────

func handleDeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id param required"})
		return
	}
	res, err := db.Exec(`DELETE FROM sessions WHERE id = ?`, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "session not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ─── /api/sessions (GET) ──────────────────────────────────────────────────────

func handleListSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	userID := r.URL.Query().Get("user_id")
	// If verifyAdminAuth is false, they are allowed to fetch ONLY their own sessions if user_id is provided.
	// Otherwise, if user_id is empty, they must be authenticated as admin.
	if !verifyAdminAuth(r) && userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var (
		rows *sql.Rows
		err  error
	)
	if userID != "" {
		rows, err = db.Query(`SELECT
			s.id, s.user_id, s.player_name, s.player_role, s.player_icon,
			s.score, s.module_idx, s.module_scores, s.domains, s.fragments,
			s.dass, s.dass_raw, s.rt_samples, s.click_density,
			s.correct_count, s.attempt_count,
			s.murderer, s.murderer_name, s.killer_guess,
			s.session_start, s.last_updated,
			COALESCE(u.email, '') AS user_email
			FROM sessions s
			LEFT JOIN users u ON s.user_id = u.id
			WHERE s.user_id = ? ORDER BY s.last_updated DESC`, userID)
	} else {
		rows, err = db.Query(`SELECT
			s.id, s.user_id, s.player_name, s.player_role, s.player_icon,
			s.score, s.module_idx, s.module_scores, s.domains, s.fragments,
			s.dass, s.dass_raw, s.rt_samples, s.click_density,
			s.correct_count, s.attempt_count,
			s.murderer, s.murderer_name, s.killer_guess,
			s.session_start, s.last_updated,
			COALESCE(u.email, '') AS user_email
			FROM sessions s
			LEFT JOIN users u ON s.user_id = u.id
			ORDER BY s.last_updated DESC`)
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	sessions := make([]Session, 0)
	for rows.Next() {
		s, err := scanSessionRow(rows)
		if err != nil {
			log.Printf("scan session row: %v", err)
			continue
		}
		sessions = append(sessions, s)
	}
	writeJSON(w, http.StatusOK, sessions)
}

// ─── row scanner helpers ──────────────────────────────────────────────────────

type rowScanner interface {
	Scan(dest ...any) error
}

func scanSession(row rowScanner) (Session, error) {
	var s Session
	var (
		moduleScores, domains, fragments string
		dass, dassRaw, rtSamples         string
		clickDensity                     string
	)
	err := row.Scan(
		&s.ID, &s.UserID, &s.PlayerName, &s.PlayerRole, &s.PlayerIcon,
		&s.Score, &s.ModuleIdx, &moduleScores, &domains, &fragments,
		&dass, &dassRaw, &rtSamples, &clickDensity,
		&s.CorrectCount, &s.AttemptCount,
		&s.Murderer, &s.MurdererName, &s.KillerGuess,
		&s.SessionStart, &s.LastUpdated,
		&s.UserEmail,
	)
	if err != nil {
		return s, err
	}
	s.ModuleScores = rawOrDefault(moduleScores, "[]")
	s.Domains = rawOrDefault(domains, "{}")
	s.Fragments = rawOrDefault(fragments, "[]")
	s.DASS = rawOrDefault(dass, "{}")
	s.DASSRaw = rawOrDefault(dassRaw, "[]")
	s.RTSamples = rawOrDefault(rtSamples, "[]")
	s.ClickDensity = rawOrDefault(clickDensity, "[]")
	return s, nil
}

func scanSessionRow(rows *sql.Rows) (Session, error) {
	var s Session
	var (
		moduleScores, domains, fragments string
		dass, dassRaw, rtSamples         string
		clickDensity                     string
	)
	err := rows.Scan(
		&s.ID, &s.UserID, &s.PlayerName, &s.PlayerRole, &s.PlayerIcon,
		&s.Score, &s.ModuleIdx, &moduleScores, &domains, &fragments,
		&dass, &dassRaw, &rtSamples, &clickDensity,
		&s.CorrectCount, &s.AttemptCount,
		&s.Murderer, &s.MurdererName, &s.KillerGuess,
		&s.SessionStart, &s.LastUpdated,
		&s.UserEmail,
	)
	if err != nil {
		return s, err
	}
	s.ModuleScores = rawOrDefault(moduleScores, "[]")
	s.Domains = rawOrDefault(domains, "{}")
	s.Fragments = rawOrDefault(fragments, "[]")
	s.DASS = rawOrDefault(dass, "{}")
	s.DASSRaw = rawOrDefault(dassRaw, "[]")
	s.RTSamples = rawOrDefault(rtSamples, "[]")
	s.ClickDensity = rawOrDefault(clickDensity, "[]")
	return s, nil
}

// ─── /api/narrator (Anthropic proxy) ─────────────────────────────────────────

func handleNarrator(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "ANTHROPIC_API_KEY not set"})
		return
	}

	// Read body from client and pass it directly to Anthropic.
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "cannot read request body"})
		return
	}

	// Ensure the model field is set to our required model.
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	payload["model"] = "claude-sonnet-4-20250514"
	if _, ok := payload["max_tokens"]; !ok {
		payload["max_tokens"] = 1024
	}

	outBody, err := json.Marshal(payload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "marshal error"})
		return
	}

	client := &http.Client{Timeout: 40 * time.Second}
	req, err := http.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(outBody))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "anthropic request failed: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "read anthropic response"})
		return
	}

	// Parse Anthropic response and extract the text content.
	var anthropicResp struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(respBody, &anthropicResp); err != nil {
		// Forward raw response if unparseable.
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(respBody)
		return
	}
	if anthropicResp.Error != nil {
		writeJSON(w, resp.StatusCode, map[string]string{"error": anthropicResp.Error.Message})
		return
	}

	content := ""
	for _, block := range anthropicResp.Content {
		if block.Type == "text" {
			content += block.Text
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"content": content})
}

// ─── session router (dispatches by method) ────────────────────────────────────

func handleSession(w http.ResponseWriter, r *http.Request) {
	if !verifyAdminAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		handleGetSession(w, r)
	case http.MethodPost, http.MethodPut:
		handleUpsertSession(w, r)
	case http.MethodDelete:
		handleDeleteSession(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

// ─── Admin Security Helpers & Handlers ────────────────────────────────────────

func verifyAdminAuth(r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	expected := "Bearer " + AdminSessionToken
	return authHeader == expected
}

func handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if body.Username != "admin" || (body.Password != AdminPassphrase && body.Password != "admin" && body.Password != "ElarisAdmin2026") {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"token": AdminSessionToken,
	})
}

func handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete && r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if !verifyAdminAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	userID := r.URL.Query().Get("id")
	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id param required"})
		return
	}
	// Delete user sessions
	_, err := db.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	// Delete user account
	res, err := db.Exec(`DELETE FROM users WHERE id = ?`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func handleClearAllSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if !verifyAdminAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	_, err := db.Exec(`DELETE FROM sessions`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "cleared"})
}

func handleResetUserProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if !verifyAdminAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	userID := r.URL.Query().Get("id")
	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id param required"})
		return
	}
	// Reset progress in users table
	res, err := db.Exec(`UPDATE users SET progress = '{}' WHERE id = ?`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	// Also delete any sessions for this user so they are completely reset on the admin dashboard
	_, _ = db.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)

	writeJSON(w, http.StatusOK, map[string]string{"status": "reset"})
}

func handleLogError(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		Error string `json:"error"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	log.Printf("[FRONTEND ERROR] %s", body.Error)
	_ = os.WriteFile("frontend_error.log", []byte(body.Error), 0644)
	writeJSON(w, http.StatusOK, map[string]string{"status": "logged"})
}

func handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if body.Username == "" || body.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username and email required"})
		return
	}

	row := db.QueryRow(
		`SELECT password FROM users WHERE username = ? AND email = ?`,
		body.Username, body.Email,
	)
	var password string
	if err := row.Scan(&password); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "matching user manifest not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":     "verified",
		"passphrase": password,
	})
}

// ─── main ─────────────────────────────────────────────────────────────────────

func main() {
	initDB()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/register", handleRegister)
	mux.HandleFunc("/api/login", handleLogin)
	mux.HandleFunc("/api/forgot-password", handleForgotPassword)
	mux.HandleFunc("/api/update-identity", handleUpdateIdentity)
	mux.HandleFunc("/api/user/progress", handleUserProgress)
	mux.HandleFunc("/api/session", handleSession)
	mux.HandleFunc("/api/sessions", handleListSessions)
	mux.HandleFunc("/api/admin/login", handleAdminLogin)
	mux.HandleFunc("/api/admin/user", handleDeleteUser)
	mux.HandleFunc("/api/admin/clear-all", handleClearAllSessions)
	mux.HandleFunc("/api/admin/reset-progress", handleResetUserProgress)
	mux.HandleFunc("/api/narrator", handleNarrator)
	mux.HandleFunc("/api/log-error", handleLogError)

	// Frontend static files
	fs := http.FileServer(http.Dir(FrontendDir))
	mux.Handle("/", fs)

	handler := corsMiddleware(mux)

	base := "http://localhost" + Port
	log.Println("╔══════════════════════════════════════════════════╗")
	log.Println("║   Last Trip to Elaris Island — Backend v2        ║")
	log.Println("╠══════════════════════════════════════════════════╣")
	log.Printf("║  Frontend  : %s%-36s║\n", base+"/", "")
	log.Printf("║  Health    : %s%-29s║\n", base+"/api/health", "")
	log.Printf("║  Register  : %s%-27s║\n", base+"/api/register", "")
	log.Printf("║  Login     : %s%-30s║\n", base+"/api/login", "")
	log.Printf("║  Session   : %s%-28s║\n", base+"/api/session", "")
	log.Printf("║  Sessions  : %s%-27s║\n", base+"/api/sessions", "")
	log.Printf("║  Narrator  : %s%-27s║\n", base+"/api/narrator", "")
	log.Println("╚══════════════════════════════════════════════════╝")

	srv := &http.Server{
		Addr:         Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}
