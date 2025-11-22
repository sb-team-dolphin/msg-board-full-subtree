package com.myapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackCreateRequest {
    @Size(max = 100, message = "사용자 이름은 최대 100자까지 입력 가능합니다")
    private String username;

    @NotBlank(message = "메시지는 필수입니다")
    @Size(max = 1000, message = "메시지는 최대 1000자까지 입력 가능합니다")
    private String message;
}
