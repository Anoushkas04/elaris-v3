FROM golang:1.21-alpine AS builder
RUN apk add --no-cache gcc musl-dev sqlite-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=1 go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates sqlite-libs
WORKDIR /root/
COPY --from=builder /app/server .
COPY frontend/ ./frontend/
RUN mkdir -p data
EXPOSE 8080
CMD ["./server"]
