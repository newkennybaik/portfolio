package com.example.mailapi.controller;

import com.example.mailapi.dto.MailRequest;
import com.example.mailapi.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mail")
public class MailController {

    @Autowired
    private MailService mailService;

    @PostMapping("/send")
    public ResponseEntity<String> sendMail(@RequestBody MailRequest request) {
        boolean result = mailService.sendEmail(request);
        return result ? ResponseEntity.ok("메일 전송 성공") : ResponseEntity.status(500).body("메일 전송 실패");
    }
}
