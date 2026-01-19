package com.example.vidyoupdater;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthController {

    // 세션 키 통일
    public static final String SESSION_USER_ID = "LOGIN_USER_ID";
    public static final String SESSION_USERNAME = "LOGIN_USERNAME";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ---------- 로그인 ----------

    @GetMapping("/login")
    public String loginForm() {
        return "login";   // templates/login.html
    }

    @PostMapping("/login")
    public String doLogin(@RequestParam String username,
                          @RequestParam String password,
                          HttpSession session,
                          Model model) {

        var optUser = authService.findByUsername(username);
        if (optUser.isEmpty()) {
            model.addAttribute("error", "Invalid username or password.");
            return "login";
        }

        User user = optUser.get();

        if (!user.isActive()) {
            model.addAttribute("error", "Account is inactive.");
            return "login";
        }

        if (!user.getPassword().equals(password)) {
            authService.recordLoginFailure(user.getId());
            model.addAttribute("error", "Invalid username or password.");
            return "login";
        }

        // 성공
        authService.recordLoginSuccess(user.getId());
        session.setAttribute(SESSION_USER_ID, user.getId());
        session.setAttribute(SESSION_USERNAME, user.getUsername());

        // 비번 강제 변경 플래그
        if (user.isMustChangePassword()) {
            model.addAttribute("message", "You must change your password first.");
            return "change-password";
        }

        // 비번 만료
        if (authService.isPasswordExpired(user)) {
            model.addAttribute("message", "Your password has expired. Please change it.");
            return "change-password";
        }

        return "redirect:/update";
    }

    // ---------- 비밀번호 변경 (GET) ----------

    @GetMapping("/change-password")
    public String changePasswordForm(HttpSession session, Model model) {
        Object uid = session.getAttribute(SESSION_USER_ID);
        if (uid == null) {
            return "redirect:/login";
        }
        // 필요하면 안내 문구 넘김
        // model.addAttribute("message", "Please change your password.");
        return "change-password"; // templates/change-password.html
    }

    // ---------- 비밀번호 변경 (POST) ----------

    @PostMapping("/change-password")
    public String doChangePassword(@RequestParam("newPw") String newPw,
                                   @RequestParam(value = "cycle",
                                                 required = false,
                                                 defaultValue = "90") int cycle,
                                   HttpSession session,
                                   Model model) {

        Object userIdObj = session.getAttribute(SESSION_USER_ID);
        if (userIdObj == null) {
            return "redirect:/login";
        }

        long userId = (userIdObj instanceof Number)
                ? ((Number) userIdObj).longValue()
                : Long.parseLong(userIdObj.toString());

        if (newPw == null || newPw.length() < 8) {
            model.addAttribute("error", "Password must be at least 8 characters.");
            return "change-password";
        }

        if (cycle != 30 && cycle != 90 && cycle != 180) {
            cycle = 90;
        }

        authService.updatePassword(userId, newPw, cycle);

        // 세션 초기화 후 다시 로그인
        session.invalidate();
        model.addAttribute("message", "Password updated. Please login again.");
        return "login";
    }

    // ---------- 로그아웃 ----------

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}
