package com.example.springbootapp.controller

import com.example.springbootapp.entity.User
import com.example.springbootapp.service.UserService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/users")
class UserController(private val userService: UserService) {

    // 이메일로 사용자 조회
    @GetMapping("/{email}")
    fun getUserByEmail(@PathVariable email: String): User? {
        return userService.getUserByEmail(email)
    }

    // 모든 사용자 조회
    @GetMapping
    fun getAllUsers(): List<User> {
        return userService.getAllUsers() // 모든 사용자 조회
    }

    // 사용자 생성
    @PostMapping
    fun createUser(@RequestBody user: User): User {
        return userService.createUser(user)
    }
}
