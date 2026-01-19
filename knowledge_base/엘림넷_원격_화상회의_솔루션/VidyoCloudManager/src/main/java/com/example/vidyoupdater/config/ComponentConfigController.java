package com.example.vidyoupdater.config;

import com.example.vidyoupdater.dto.ComponentConfigDto;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/component-config")
public class ComponentConfigController {

    private final ComponentConfigService componentConfigService;

    public ComponentConfigController(ComponentConfigService componentConfigService) {
        this.componentConfigService = componentConfigService;
    }

    // ---- GET /api/component-config/{component}
    //  → update.html 에서 서버 목록 불러올 때 사용
    @GetMapping("/{component}")
    public ComponentConfigDto getComponentConfig(@PathVariable String component) {

        List<String> ips =
                componentConfigService.getIpsForComponent(component);

        int limit =
                componentConfigService.getConcurrencyLimitForComponent(component);

        // limit(int)을 Integer로 감싸서 반환
        return new ComponentConfigDto(component, ips, limit);
    }

    // ---- POST /api/component-config/{component}
    //  → update.html 의 saveSettings() 에서 IP 저장할 때 사용
    @PostMapping("/{component}")
    public ComponentConfigDto saveComponentConfig(@PathVariable String component,
                                                  @RequestBody ComponentConfigDto request) {

        // JS 에서 component 를 body에 안 실어도 되므로, pathVariable 기준으로 사용
        List<String> ips = request.getIps();
        if (ips == null) {
            ips = new ArrayList<>();
        }

        // null 허용
        Integer reqLimit = request.getConcurrencyLimit();
        int limit = (reqLimit != null && reqLimit > 0) ? reqLimit : 0;

        componentConfigService.saveComponentConfig(component, ips, limit);

        // 저장 후 값 다시 읽어서 리턴
        List<String> savedIps =
                componentConfigService.getIpsForComponent(component);

        int savedLimit =
                componentConfigService.getConcurrencyLimitForComponent(component);

        return new ComponentConfigDto(component, savedIps, savedLimit);
    }
}
