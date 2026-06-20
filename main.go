package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

type PlayerData struct {
	Username string `json:"username"`
	Gold     int    `json:"gold"`
	Elixir   int    `json:"elixir"`
	TownHall int    `json:"town_hall"`
}

var (
	players   = make(map[string]*PlayerData)
	playersMu sync.Mutex
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Ana sayfa
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, "<h1>Clash Of Manyak Sunucusu Aktif!</h1>")
	})

	// Kayıt olma ve giriş (İkisini tek istekte çözen temiz sistem)
	http.HandleFunc("/play", handlePlay)

	log.Printf("Sunucu %s portunda baslatildi...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handlePlay(w http.ResponseWriter, r *http.Request) {
	// CORS Ayarları (Her yerden baglanilabilsin diye)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	username := r.URL.Query().Get("username")
	if username == "" {
		w.Write([]byte(`{"error": "Kullanici adi girilmedi!"}`))
		return
	}

	playersMu.Lock()
	p, exists := players[username]
	if !exists {
		// Yeni oyuncu olustur
		p = &PlayerData{
			Username: username,
			Gold:     1000,
			Elixir:   1000,
			TownHall: 1,
		}
		players[username] = p
	} else {
		// Eski oyuncuysa pasif gelir ekle
		p.Gold += 50 * p.TownHall
		p.Elixir += 50 * p.TownHall
	}
	playersMu.Unlock()

	json.NewEncoder(w).Encode(p)
}