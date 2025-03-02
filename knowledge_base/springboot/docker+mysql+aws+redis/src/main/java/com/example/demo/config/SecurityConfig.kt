package com.example.springbootapp.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler

@Configuration
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity, clientRegistrationRepository: ClientRegistrationRepository): SecurityFilterChain {
        http
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/public/**", "/users/signup", "/users/login").permitAll()  // ✅ 회원가입 및 로그인은 인증 없이 접근 가능
                    .anyRequest().authenticated()
            }
            .csrf { csrf -> csrf.disable() } // ✅ CSRF 비활성화 (테스트용)
            .sessionManagement { session -> session.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS) } // ✅ JWT 기반 세션 관리
            .oauth2Login { oauth2 ->
                oauth2.defaultSuccessUrl("/home", true)
            }
            .logout { logout ->
                logout.logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository))
            }
            .oauth2ResourceServer {
                it.jwt { jwtConfigurer ->
                    jwtConfigurer.jwkSetUri("https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_QnnMzXAi2/.well-known/jwks.json")
                }
            }

        return http.build()
    }

    /**
     * ✅ Cognito 로그아웃 설정 (OIDC Logout)
     */
    @Bean
    fun oidcLogoutSuccessHandler(clientRegistrationRepository: ClientRegistrationRepository): LogoutSuccessHandler {
        val logoutHandler = OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository)
        logoutHandler.setPostLogoutRedirectUri("http://localhost:8080/logout-success") // ✅ 로그아웃 후 리디렉션 URL 변경
        return logoutHandler
    }
}
