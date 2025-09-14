package com.example.GwentMarketPlace.repository;

import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.CardTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardTemplateRepository extends JpaRepository<CardTemplate,Long> {

  Slice<CardTemplate> getCardTemplatesByRarity(String rarity, PageRequest pageRequest);

  long countCardTemplateByRarity(String rarity);
}
