package com.example.springbootapp.service

import com.example.springbootapp.entity.User
import com.example.springbootapp.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(private val userRepository: UserRepository) {

    // 이메일로 사용자 조회
    fun getUserByEmail(email: String): User? {
        return userRepository.findByEmail(email).orElse(null)
    }

    // 사용자 생성
    fun createUser(user: User): User {
        return userRepository.save(user)
    }

    // 모든 사용자 조회
    fun getAllUsers(): List<User> {
        return userRepository.findAll()
    }
}
