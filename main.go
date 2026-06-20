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

// Oyuncu Hesap Bilgileri
type Account struct {
	Username string `json:"username"`
	Password string `json:"password"` // Gerçek projede şifreler hash'lenir
	Token    string `json:"token"`
}

// Oyun İçi Köy Verileri
type PlayerData struct {
	Gold     int `json:"gold"`
	Elixir   int `json:"elixir"`
	TownHall int `json:"town_hall"`
}

var (
	accounts   = make(map[string]*Account)    // username -> Account
	tokens     = make(map[string]string)      // token -> username
	playerData = make(map[string]*PlayerData) // username -> Data
	mu         sync.Mutex

	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// HTTP Endpoint'leri
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Clash Of Manyak Altyapisi Hazir!")
	})
	
	http.HandleFunc("/register", handleRegister)
	http.HandleFunc("/login", handleLogin)
	http.HandleFunc("/ws", handleConnections)

	log.Printf("Sunucu %s portunda aktif!", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

// 1. KAYIT OLMA SİSTEMİ
func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Sadece POST", http.StatusMethodNotAllowed)
		return
	}

	var req Account
	json.NewDecoder(r.Body).Decode(&req)

	mu.Lock()
	defer mu.Unlock()

	if _, exists := accounts[req.Username]; exists {
		w.Write([]byte(`{"status":"error","message":"Bu kullanici adi alinmis!"}`))
		return
	}

	// Hesabı ve başlangıç köyünü oluştur
	accounts[req.Username] = &Account{Username: req.Username, Password: req.Password}
	playerData[req.Username] = &PlayerData{Gold: 1000, Elixir: 1000, TownHall: 1}

	w.Write([]byte(`{"status":"success","message":"Hesap basariyla acildi!"}`))
}

// 2. GİRİŞ YAPMA SİSTEMİ
func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var req Account
	json.NewDecoder(r.Body).Decode(&req)

	mu.Lock()
	defer mu.Unlock()

	acc, exists := accounts[req.Username]
	if !exists || acc.Password != req.Password {
		w.Write([]byte(`{"status":"error","message":"Hatali kullanici adi veya sifre!"}`))
		return
	}

	// Giriş başarılıysa oyuncuya özel geçici bir token üret
	token := fmt.Sprintf("token_%s_%d", req.Username, time.Now().Unix())
	tokens[token] = req.Username

	w.Write([]byte(fmt.Sprintf(`{"status":"success","token":"%s"}`, token)))
}

// 3. OYUN BAĞLANTISI (WEBSOCKET)
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Bağlanırken URL'den token istenecek: ws://linkiniz.com/ws?token=xxxx
	token := r.URL.Query().Get("token")

	mu.Lock()
	username, valid := tokens[token]
	mu.Unlock()

	if !valid {
		log.Println("Gecersiz token ile baglanti reddedildi.")
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer ws.Close()

	log.Printf("%s oyuna baglandi!", username)

	// Gerçek zamanlı veri döngüsü
	for {
		mu.Lock()
		p, exists := playerData[username]
		if exists {
			// Her saniye pasif maden geliri ekle
			p.Gold += 2 * p.TownHall
			p.Elixir += 2 * p.TownHall
		}
		mu.Unlock()

		if !exists {
			break
		}

		// Güncel veriyi oyuncuya gönder
		data, _ := json.Marshal(p)
		if err := ws.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("%s oyundan cikti.", username)
			break
		}
		time.Sleep(1 * time.Second)
	}
}
