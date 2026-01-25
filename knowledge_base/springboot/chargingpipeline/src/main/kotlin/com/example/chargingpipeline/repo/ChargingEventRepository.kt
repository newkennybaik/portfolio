package com.example.chargingpipeline.repo

import com.example.chargingpipeline.model.ChargingEventDocument
import org.springframework.data.mongodb.repository.MongoRepository

interface ChargingEventRepository : MongoRepository<ChargingEventDocument, String> {
    fun existsByEventId(eventId: String): Boolean
    fun findBySessionIdOrderByOccurredAtAsc(sessionId: String): List<ChargingEventDocument>
}
