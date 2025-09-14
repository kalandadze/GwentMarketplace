package com.example.GwentMarketPlace.repository;

import com.example.GwentMarketPlace.dto.ListingDto;
import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.User;
import com.example.GwentMarketPlace.service.GwentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

  int countCardsByTemplateName(String name);

  List<Card> findAllByTemplateName(String name);

  Card getCardByTemplateNameAndNumber(String templateName,Integer number);

  List<Card> findAllByTemplateNameAndOwnerIsNull(String cardName);

  Card getCardByTemplateNameAndNumberAndOwnerIsNull(String cardName, Integer number);

  int countCardsByTemplateRarity(String rarity);

  Page<Card> getCardByTemplateRarity(String rarity, Pageable pageable);
}
