package com.example.GwentMarketPlace.repository;

import com.example.GwentMarketPlace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
  Optional<User> findByEmail(String email);

  User getUserByEmail(String email);
}
