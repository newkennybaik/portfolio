package com.example.chargingpipeline.api

import com.example.chargingpipeline.kafka.ChargingEventProducer
import com.example.chargingpipeline.model.ChargingEventRequest
import com.example.chargingpipeline.repo.ChargingEventRepository
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/charging")
class ChargingEventController(
    private val producer: ChargingEventProducer,
    private val repo: ChargingEventRepository
) {

    // (1) 이벤트 수신 -> Kafka publish -> 즉시 OK
    @PostMapping("/events")
    fun ingest(@Valid @RequestBody req: ChargingEventRequest): ResponseEntity<Map<String, Any>> {
        producer.publish(req)
        return ResponseEntity.ok(mapOf("status" to "OK", "eventId" to req.eventId))
    }

    // (2) 조회: 특정 sessionId 이벤트를 시간순으로 조회 (테스트용)
    @GetMapping("/sessions/{sessionId}/events")
    fun listSessionEvents(@PathVariable sessionId: String): ResponseEntity<Any> {
        val list = repo.findBySessionIdOrderByOccurredAtAsc(sessionId)
        return ResponseEntity.ok(list)
    }
}
