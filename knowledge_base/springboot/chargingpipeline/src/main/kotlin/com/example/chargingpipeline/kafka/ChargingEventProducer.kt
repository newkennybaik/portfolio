package com.example.chargingpipeline.kafka

import com.example.chargingpipeline.model.ChargingEventRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

@Component
class ChargingEventProducer(
    private val kafkaTemplate: KafkaTemplate<String, ChargingEventRequest>,
    @Value("\${app.kafka.topic}") private val topic: String
) {
    fun publish(event: ChargingEventRequest) {
        // key를 sessionId로 주면 같은 세션이 같은 파티션으로 가서 순서 안정성이 좋아짐
        kafkaTemplate.send(topic, event.sessionId, event)
    }
}
