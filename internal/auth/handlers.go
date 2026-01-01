package auth

import "net/http"

// CallbackHandler handles auth provider callbacks.
func CallbackHandler(provider Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if provider == nil {
			http.NotFound(w, r)
			return
		}
		if err := provider.HandleCallback(w, r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	}
}
