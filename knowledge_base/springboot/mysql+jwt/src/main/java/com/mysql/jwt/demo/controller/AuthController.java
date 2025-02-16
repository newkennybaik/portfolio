package com.mysql.jwt.demo.controller;

import com.mysql.jwt.demo.model.User;
import com.mysql.jwt.demo.repository.UserRepository;
import com.mysql.jwt.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // 모든 클라이언트에서 요청 허용
public class AuthController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ✅ 회원가입
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    // ✅ 로그인 (JWT 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser.isPresent() && passwordEncoder.matches(user.getPassword(), existingUser.get().getPassword())) {
            String token = jwtUtil.generateToken(user.getUsername());
            return ResponseEntity.ok(token);
        }
        return ResponseEntity.status(401).body("Invalid username or password");
    }

    // ✅ 로그인한 사용자 정보 반환 (JWT 인증)
    @GetMapping("/me")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        Optional<User> user = userRepository.findByUsername(username);

        if (user.isPresent()) {
            return ResponseEntity.ok(user.get()); // ✅ User 객체 그대로 반환
        } else {
            return ResponseEntity.status(404).body("User not found"); // ✅ ResponseEntity로 직접 반환
        }
    }
}
