package com.example.chargingpipeline.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("charging_events")
data class ChargingEventDocument(
    @Id
    val id: String? = null,

    @Indexed(unique = true)
    val eventId: String,

    val sessionId: String,
    val type: ChargingEventType,

    val payload: Map<String, Any>? = emptyMap(),
    val occurredAt: Instant,

    val receivedAt: Instant
)
