package com.myapp.config;

import com.myapp.model.Feedback;
import com.myapp.repository.FeedbackRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(FeedbackRepository repository) {
        return args -> {
            // 데이터가 없을 때만 초기 데이터 삽입
            if (repository.count() == 0) {
                repository.save(new Feedback("이용자A", "서비스 잘 사용하고 있습니다!"));
                repository.save(new Feedback("익명", "개선 아이디어 하나 제안드립니다"));
                repository.save(new Feedback("김철수", "UI가 직관적이고 사용하기 편해요"));
                repository.save(new Feedback("익명", "로그인 기능이 추가되면 좋겠습니다"));
                repository.save(new Feedback("박영희", "모바일 앱도 만들어주세요!"));
                System.out.println("Initial feedback data loaded successfully!");
            }
        };
    }
}
