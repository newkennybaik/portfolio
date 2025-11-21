package com.example.moderator_pin.web;

import com.example.moderator_pin.vidyo.VidyoSoapClient;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class WebPageController {

    private final VidyoSoapClient vidyo;

    public WebPageController(VidyoSoapClient vidyo) {
        this.vidyo = vidyo;
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @PostMapping("/web/pin/create")
    public String createPin(@RequestParam("username") String username,
                            @RequestParam("pin") String pin,
                            Model model) {

        String result = vidyo.createModeratorPinByUsername(username, pin);
        model.addAttribute("result", result);
        return "index";
    }

    @PostMapping("/web/pin/remove")
    public String removePin(@RequestParam("username") String username,
                            Model model) {

        String result = vidyo.removeModeratorPinByUsername(username);
        model.addAttribute("result", result);
        return "index";
    }
}
