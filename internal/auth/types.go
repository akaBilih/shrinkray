package auth

import (
	"errors"
	"net/http"
)

// User represents an authenticated user.
type User struct {
	ID    string
	Email string
	Name  string
}

var (
	// ErrSessionExpired indicates an authenticated session is no longer valid due to expiry.
	ErrSessionExpired = errors.New("session expired")
	// ErrSessionInvalid indicates an authenticated session is no longer valid.
	ErrSessionInvalid = errors.New("session invalid")
)

// Provider authenticates incoming requests and manages login callbacks.
type Provider interface {
	Authenticate(r *http.Request) (*User, error)
	LoginURL(r *http.Request) (string, error)
	HandleCallback(w http.ResponseWriter, r *http.Request) error
}

// SessionCleaner clears any stored session state (cookies).
type SessionCleaner interface {
	ClearSession(w http.ResponseWriter, r *http.Request)
}

// LogoutHandlerProvider allows providers to implement logout handling.
type LogoutHandlerProvider interface {
	HandleLogout(w http.ResponseWriter, r *http.Request) error
}
