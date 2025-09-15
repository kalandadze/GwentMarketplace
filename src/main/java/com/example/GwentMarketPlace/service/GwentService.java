package com.example.GwentMarketPlace.service;

import com.example.GwentMarketPlace.controller.GwentController;
import com.example.GwentMarketPlace.dto.CardDto;
import com.example.GwentMarketPlace.dto.CardTemplateDto;
import com.example.GwentMarketPlace.dto.ListingDto;
import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.CardTemplate;
import com.example.GwentMarketPlace.model.Listing;
import com.example.GwentMarketPlace.model.User;
import com.example.GwentMarketPlace.repository.CardRepository;
import com.example.GwentMarketPlace.repository.CardTemplateRepository;
import com.example.GwentMarketPlace.repository.ListingRepository;

import static com.example.GwentMarketPlace.util.ModelConverter.*;

import com.example.GwentMarketPlace.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;


@Service
public class GwentService {
  private final CardRepository cardRepository;
  private final ListingRepository listingRepository;
  private final CardTemplateRepository cardTemplateRepository;
  private final UserRepository userRepository;

  public GwentService(CardRepository cardRepository, ListingRepository listingRepository, CardTemplateRepository cardTemplateRepository, UserRepository userRepository) {
    this.cardRepository = cardRepository;
    this.listingRepository = listingRepository;
    this.cardTemplateRepository = cardTemplateRepository;
    this.userRepository = userRepository;
  }

  public List<CardDto> getAllCardsByName(String name) {
    return convertCards(cardRepository.findAllByTemplateName(name));
  }

  public List<CardWithCountDTO> getUniqueCardsWithCountByPageAndSortBy(Integer size, Integer page, sortBy sortBy, List<GwentController.Rarity> rarities, GwentController.Faction faction, List<GwentController.Type> types, Integer minPower, Integer maxPower) {
    List<CardTemplate> results = cardTemplateRepository.findAll(PageRequest.of(page, size, Sort.by(sortBy.toString()))).toList();
    results = filter(results, rarities, faction, types, minPower, maxPower);
    List<CardWithCountDTO> dtos = new ArrayList<>();
    results.forEach(card -> findCount(card, dtos));
    return dtos;
  }

  private List<CardTemplate> filter(List<CardTemplate> results, List<GwentController.Rarity> rarities, GwentController.Faction faction, List<GwentController.Type> types, Integer minPower, Integer maxPower) {
    results = filterByRarity(results, rarities);
    results = filterByFaction(results, faction);
    results = filterByType(results, types);
    results = filterByPower(results, minPower, maxPower);
    return results;
  }

  private List<CardTemplate> filterByPower(List<CardTemplate> results, Integer minPower, Integer maxPower) {
    return results.stream().filter(cardTemplate -> (cardTemplate.getPower() >= minPower) && (cardTemplate.getPower() <= maxPower)).toList();
  }

  private List<CardTemplate> filterByFaction(List<CardTemplate> results, GwentController.Faction faction) {
    if (faction == null) return results;
    return results.stream().filter(c -> c.getFaction().replace(" ","").equals(faction.toString())).toList();
  }

  private List<CardTemplate> filterByType(List<CardTemplate> results, List<GwentController.Type> types) {
    if (types == null) return results;
    return results.stream().filter(template -> types.contains(GwentController.Type.valueOf(template.getType()))).toList();
  }

  private List<CardTemplate> filterByRarity(List<CardTemplate> results, List<GwentController.Rarity> rarities) {
    if (rarities == null) return results;
    return results.stream().filter(template -> rarities.contains(GwentController.Rarity.valueOf(template.getRarity()))).toList();
  }

  public Object getTemplate(Long templateId) {
    return convert(cardTemplateRepository.getById(templateId));
  }


  private void findCount(CardTemplate card, List<CardWithCountDTO> dtos) {
    Long count = (long) cardRepository.countCardsByTemplateName(card.getName());
    dtos.add(new CardWithCountDTO(convert(card), count));
  }

  public List<ListingDto> getListingsByName(String cardName) {
    List<ListingDto> listings = new ArrayList<>();
    listings.addAll(convertListings(listingRepository.findAllByCardTemplateName(cardName)));
    List<ListingDto> systemListings = cardRepository.findAllByTemplateNameAndOwnerIsNull(cardName).stream().map(this::createListing).toList();
    systemListings.forEach(listingDto -> {
      if (listings.stream().noneMatch(listing -> listing.getCard().equals(listingDto.getCard()))) {
        listings.add(listingDto);
      }
    });
    return listings;
  }

  private ListingDto createListing(Card card) {
    int price = getDefaultPrice(card);

    return ListingDto.builder()
      .seller(null)
      .price(price)
      .card(convert(card))
      .build();
  }

  @Transactional
  public void quicksell(String email, String cardName, Integer number) {
    User user = userRepository.getUserByEmail(email);
    Card card = cardRepository.getCardByTemplateNameAndNumber(cardName, number);
    if (!card.getOwner().getEmail().equals(email)) throw new IllegalArgumentException("You do not own the card");
    if (user == null) throw new IllegalArgumentException("User does not exist");

    int price = getDefaultPrice(card) / 2;
    user.getCollection().remove(card);
    user.setBalance(user.getBalance() + price);
    userRepository.save(user);
    card.setOwner(null);
    cardRepository.save(card);
  }

  private int getDefaultPrice(Card card) {
    return switch (card.getTemplate().getRarity()) {
      case "Legendary" -> 10000;
      case "Epic" -> 5000;
      case "Rare" -> 2000;
      case "Common" -> 500;
      default -> throw new IllegalStateException("Unexpected rarity: " + card.getTemplate().getRarity());
    };
  }

  @Transactional
  public void buyCard(String email, String cardName, Integer number) {
    User user = userRepository.getUserByEmail(email);
    if (user == null) throw new IllegalArgumentException("Buyer Account not found");

    Listing listing = listingRepository.findListingByCardTemplateNameAndCardNumber(cardName, number);
    if (listing == null) {
      Card card = cardRepository.getCardByTemplateNameAndNumberAndOwnerIsNull(cardName, number);
      if (card != null) {
        buyNewCard(user, card);
        return;
      }
      throw new IllegalArgumentException("Card is not listed for sale, or has already been sold");
    }
    if (listing.getPrice() > user.getBalance()) throw new IllegalArgumentException("Not enough balance for card");

    listingRepository.removeListingByIdIs(listing.getId());
    user.setBalance(user.getBalance() - listing.getPrice());
    user.getCollection().add(listing.getCard());
    userRepository.save(user);
    User oldOwner = listing.getSeller();
    oldOwner.setBalance(oldOwner.getBalance() + listing.getPrice());
    userRepository.save(oldOwner);
    listing.getCard().setOwner(user);
    cardRepository.save(listing.getCard());
  }

  private void buyNewCard(User user, Card card) {
    int price = getDefaultPrice(card);
    if (price > user.getBalance()) throw new IllegalArgumentException("Not enough balance for card");
    user.setBalance(user.getBalance() - price);
    user.getCollection().add(card);
    userRepository.save(user);
    card.setOwner(user);
    cardRepository.save(card);
  }

  @Transactional
  public void sellCard(String email, String cardName, Integer number, Integer price) {
    User user = userRepository.getUserByEmail(email);
    Card card = cardRepository.getCardByTemplateNameAndNumber(cardName, number);
    if (!card.getOwner().getEmail().equals(email)) throw new IllegalArgumentException("You do not own the card");
    if (user == null) throw new IllegalArgumentException("User does not exist");
    Listing listing = listingRepository.findListingByCardTemplateNameAndCardNumber(cardName, number);
    if (listing != null) throw new IllegalArgumentException("Card is already Listed");
    listing = Listing.builder()
      .seller(user).price(price).card(card).build();
    listingRepository.save(listing);
    user.getCollection().remove(card);
    userRepository.save(user);
    card.setOwner(null);
    cardRepository.save(card);
  }

  public enum sortBy {
    faction,
    rarity,
    power,
    name,
    category,
    set,
    type
  }

  @Data
  @AllArgsConstructor
  public class CardWithCountDTO {
    private CardTemplateDto card;
    private Long count;
  }
}
