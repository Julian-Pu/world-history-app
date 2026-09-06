package com.history.app.exception;

import lombok.Getter;

/**
 * 业务异常
 */
@Getter
public class BusinessException extends RuntimeException {

    private final Integer code;
    private final String errorCode;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, Integer code) {
        super(message);
        this.code = code;
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, Integer code, String errorCode) {
        super(message);
        this.code = code;
        this.errorCode = errorCode;
    }
}
