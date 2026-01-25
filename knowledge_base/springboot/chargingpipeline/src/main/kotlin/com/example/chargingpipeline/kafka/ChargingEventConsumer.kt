package com.example.chargingpipeline.kafka

import com.example.chargingpipeline.model.ChargingEventDocument
import com.example.chargingpipeline.model.ChargingEventRequest
import com.example.chargingpipeline.repo.ChargingEventRepository
import org.slf4j.LoggerFactory
import org.springframework.dao.DuplicateKeyException
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class ChargingEventConsumer(
    private val repo: ChargingEventRepository
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @KafkaListener(
        topics = ["\${app.kafka.topic}"],
        containerFactory = "kafkaListenerContainerFactory"
    )
    fun consume(event: ChargingEventRequest, ack: Acknowledgment) {
        try {
            val doc = ChargingEventDocument(
                eventId = event.eventId,
                sessionId = event.sessionId,
                type = event.type,
                payload = event.payload ?: emptyMap(),
                occurredAt = event.occurredAt ?: Instant.now(),
                receivedAt = Instant.now()
            )

            repo.insert(doc) // Unique index(eventId) 위반 시 DuplicateKeyException
            ack.acknowledge()
        } catch (e: DuplicateKeyException) {
            // 중복 이벤트: 저장 스킵하고 offset만 커밋 (멱등)
            log.warn("Duplicate event ignored: eventId={}", event.eventId)
            ack.acknowledge()
        } catch (e: Exception) {
            // 여기서 ack 안 하면 메시지가 재처리됨 (최소 구현)
            log.error("Consume failed, will retry: eventId=${event.eventId}", e)
            throw e
        }
    }
}
