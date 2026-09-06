package com.history.app.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

/**
 * Favicon 处理器
 * 解决浏览器请求 /favicon.ico 返回 500 的问题
 */
@RestController
public class FaviconController {

    @GetMapping("/favicon.ico")
    public ResponseEntity<Resource> favicon() {
        // 优先尝试前端构建产物中的 favicon.svg
        try {
            File svgFile = new File("../front/dist/client/favicon.svg");
            if (svgFile.exists()) {
                Resource resource = new org.springframework.core.io.FileSystemResource(svgFile);
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_TYPE, "image/svg+xml");
                return new ResponseEntity<>(resource, headers, HttpStatus.OK);
            }
        } catch (Exception e) {
            // ignore
        }

        // 如果没有 favicon 文件，返回 204 No Content，避免 500 错误
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
