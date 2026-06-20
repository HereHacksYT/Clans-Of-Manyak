package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	ID       string `json:"id"`
	Gold     int    `json:"gold"`
	Elixir   int    `json:"elixir"`
	TownHall int    `json:"town_hall"`
}

var (
	players   = make(map[string]*Player)
	playersMu sync.Mutex
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Clash Of Manyak Sunucusu Aktif!")
	})
	http.HandleFunc("/ws", handleConnections)

	log.Printf("Sunucu %s portunda baslatiliyor...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer ws.Close()

	playerID := fmt.Sprintf("manyak_%d", time.Now().UnixNano()%1000)
	p := &Player{ID: playerID, Gold: 1000, Elixir: 1000, TownHall: 1}

	playersMu.Lock()
	players[playerID] = p
	playersMu.Unlock()

	for {
		// Her 2 saniyede bir oyuncuya güncel kaynak durumunu gönderir
		p.Gold += 5 * p.TownHall
		p.Elixir += 5 * p.TownHall

		data, _ := json.Marshal(p)
		if err := ws.WriteMessage(websocket.TextMessage, data); err != nil {
			playersMu.Lock()
			delete(players, playerID)
			playersMu.Unlock()
			break
		}
		time.Sleep(2 * time.Second)
	}
}
