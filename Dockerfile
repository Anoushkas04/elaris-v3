FROM golang:1.21-alpine AS builder
RUN apk add --no-cache gcc musl-dev sqlite-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=1 go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates sqlite-libs
WORKDIR /app
RUN mkdir -p backend data
COPY --from=builder /app/server ./backend/server
COPY frontend/ ./frontend/
EXPOSE 8080
WORKDIR /app/backend
CMD ["./server"]
