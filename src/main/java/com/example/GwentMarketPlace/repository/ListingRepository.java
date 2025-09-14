package com.example.GwentMarketPlace.repository;

import com.example.GwentMarketPlace.dto.ListingDto;
import com.example.GwentMarketPlace.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing,Long> {
  List<Listing> findAllByCardTemplateName(String cardCardTemplateName);

  Listing findListingByCardTemplateNameAndCardNumber(String cardName, Integer number);

  void removeListingByIdIs(Long id);
}
