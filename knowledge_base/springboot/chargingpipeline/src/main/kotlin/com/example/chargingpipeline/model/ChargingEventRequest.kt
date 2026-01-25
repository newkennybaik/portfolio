package com.example.chargingpipeline.model

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class ChargingEventRequest(
    @field:NotBlank
    val eventId: String,

    @field:NotBlank
    val sessionId: String,

    @field:NotNull
    val type: ChargingEventType,

    // 측정값/종료정보 등은 유연하게 맵으로 받음 (초기 구축용)
    val payload: Map<String, Any>? = emptyMap(),

    // 이벤트 발생 시간(게이트웨이 기준) - 없으면 서버가 now로 넣어도 됨
    val occurredAt: Instant? = null
)
