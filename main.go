package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/streadway/amqp"
)

func main() {
	conn, err := amqp.Dial("amqp://rabbitmq:1jj395qu@localhost:5672/")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()

	var queue = "q.sing.service"

	SendRabbitMQ(ch, queue)
	fmt.Println("send message")
	ConsumeRabbitMQ(ch, queue)
}

func ConsumeRabbitMQ(ch *amqp.Channel, queue string) {

	msgs, err := ch.Consume(queue, "", true, false, false, false, nil)
	if err != nil {
		log.Fatal(err)
	}

	var forever chan struct{}

	go func() {
		for d := range msgs {
			fmt.Printf("Received a message: %s\n", d.Body)
			fmt.Println("type :: " + time.Now().Format("2006-01-02 15:04:05"))
			// d.Ack(true)
		}
	}()

	fmt.Println(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}

func SendRabbitMQ(ch *amqp.Channel, queue string) {

	msg := map[string]interface{}{
		"message": "Hello World!",
	}

	b, _ := json.Marshal(msg)

	err := ch.Publish("ex.sing", queue, false, false, amqp.Publishing{
		ContentType:     "application/json",
		Body:            []byte(b),
		Type:            "go",
		ContentEncoding: "utf-8",
	})
	if err != nil {
		log.Fatal(err)
	}
}
