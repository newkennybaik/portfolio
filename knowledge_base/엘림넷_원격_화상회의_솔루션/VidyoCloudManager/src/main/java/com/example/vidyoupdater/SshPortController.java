package com.example.vidyoupdater;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ssh-port")
public class SshPortController {

    @GetMapping
    public Map<String, Object> getPort() {
        Map<String, Object> res = new HashMap<>();
        res.put("port", SshPortStore.getPort());
        return res;
    }

    public static class PortReq {
        private Integer port;
        public Integer getPort() { return port; }
        public void setPort(Integer port) { this.port = port; }
    }

    @PutMapping
    public ResponseEntity<String> setPort(@RequestBody PortReq req) {
        int p = 22;
        if (req != null && req.getPort() != null) p = req.getPort();
        SshPortStore.setPort(p);
        return ResponseEntity.ok("OK");
    }
}
