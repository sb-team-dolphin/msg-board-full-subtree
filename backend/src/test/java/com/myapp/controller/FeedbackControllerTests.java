package com.myapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myapp.dto.FeedbackCreateRequest;
import com.myapp.dto.FeedbackResponse;
import com.myapp.service.FeedbackService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FeedbackController.class)
class FeedbackControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FeedbackService feedbackService;

    @Test
    void createFeedback_ShouldReturnCreatedFeedback() throws Exception {
        // given
        FeedbackCreateRequest request = new FeedbackCreateRequest("이용자A", "서비스 잘 사용하고 있습니다!");
        FeedbackResponse response = new FeedbackResponse(1L, "이용자A", "서비스 잘 사용하고 있습니다!", LocalDateTime.now());

        when(feedbackService.createFeedback(any(FeedbackCreateRequest.class)))
                .thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/feedbacks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("이용자A"))
                .andExpect(jsonPath("$.data.message").value("서비스 잘 사용하고 있습니다!"));
    }

    @Test
    void createFeedback_WithEmptyMessage_ShouldReturn400() throws Exception {
        // given
        FeedbackCreateRequest request = new FeedbackCreateRequest("이용자A", "");

        // when & then
        mockMvc.perform(post("/api/feedbacks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    void getFeedbacks_ShouldReturnPagedFeedbacks() throws Exception {
        // given
        List<FeedbackResponse> feedbacks = Arrays.asList(
                new FeedbackResponse(1L, "이용자A", "서비스 잘 사용하고 있습니다!", LocalDateTime.now()),
                new FeedbackResponse(2L, "익명", "개선 아이디어 하나 제안드립니다", LocalDateTime.now())
        );
        Page<FeedbackResponse> page = new PageImpl<>(feedbacks, PageRequest.of(0, 20), 2);

        when(feedbackService.getFeedbacks(eq(null), any()))
                .thenReturn(page);

        // when & then
        mockMvc.perform(get("/api/feedbacks")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].username").value("이용자A"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void getFeedbacks_WithUsernameFilter_ShouldReturnFilteredFeedbacks() throws Exception {
        // given
        List<FeedbackResponse> feedbacks = Arrays.asList(
                new FeedbackResponse(1L, "이용자A", "서비스 잘 사용하고 있습니다!", LocalDateTime.now())
        );
        Page<FeedbackResponse> page = new PageImpl<>(feedbacks, PageRequest.of(0, 20), 1);

        when(feedbackService.getFeedbacks(eq("이용자A"), any()))
                .thenReturn(page);

        // when & then
        mockMvc.perform(get("/api/feedbacks")
                        .param("page", "0")
                        .param("size", "20")
                        .param("username", "이용자A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].username").value("이용자A"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }
}
