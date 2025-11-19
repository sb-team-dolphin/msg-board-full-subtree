package com.myapp.service;

import com.myapp.model.User;
import com.myapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public List<User> findAll() {
        log.info("Finding all users");
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        log.info("Finding user by id: {}", id);
        return userRepository.findById(id);
    }

    public User save(User user) {
        log.info("Saving user: {}", user.getName());
        return userRepository.save(user);
    }

    public Optional<User> update(Long id, User user) {
        log.info("Updating user with id: {}", id);
        if (!userRepository.existsById(id)) {
            return Optional.empty();
        }
        user.setId(id);
        return Optional.of(userRepository.save(user));
    }

    public boolean deleteById(Long id) {
        log.info("Deleting user with id: {}", id);
        if (!userRepository.existsById(id)) {
            return false;
        }
        userRepository.deleteById(id);
        return true;
    }
}
