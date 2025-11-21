package com.example.moderator_pin.web;

import com.example.moderator_pin.vidyo.VidyoSoapClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/vidyo")
public class VidyoController {

    private final VidyoSoapClient vidyo;

    public VidyoController(VidyoSoapClient vidyo) {
        this.vidyo = vidyo;
    }

    // username 기준 PIN 생성
    @PostMapping("/pin/create")
    public String createPin(@RequestParam String username,
                            @RequestParam String pin) {
        return vidyo.createModeratorPinByUsername(username, pin);
    }

    // username 기준 PIN 제거
    @PostMapping("/pin/remove")
    public String removePin(@RequestParam String username) {
        return vidyo.removeModeratorPinByUsername(username);
    }
}
