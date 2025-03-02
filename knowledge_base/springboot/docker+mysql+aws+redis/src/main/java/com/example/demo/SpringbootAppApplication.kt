package com.example.springbootapp

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class SpringbootAppApplication

fun main(args: Array<String>) {
    // `runApplication` 대신 SpringApplication.run()을 사용
    SpringApplication.run(SpringbootAppApplication::class.java, *args)
}
