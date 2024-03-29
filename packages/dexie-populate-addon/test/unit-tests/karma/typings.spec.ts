import { Dexie } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { populate } from "../../../src";
import { Populated } from "../../../src/types";
import {
  databasesPositive,
  Friend,
  mockClubs,
  mockFriends,
  mockGroups,
  mockStyles,
  mockThemes,
} from "../../mocks/mocks.spec";

export const typings = async () => {
  const db = databasesPositive[0].db(Dexie, populate);
  await db.open();
  expect(db.isOpen()).toBeTrue();
  // Just some type matching, should not error in IDE / compilation or test
  const [friend] = mockFriends(1);
  const friendId = await db.friends.add(friend);
  const friends = mockFriends();
  const [friendTest] = mockFriends(1);
  const clubs = mockClubs();
  const [clubTest] = mockClubs(1);
  const groups = mockGroups();
  const [groupTest] = mockGroups(1);
  const themes = mockThemes();
  const styles = mockStyles();
  const friendIds = await Promise.all(friends.map((x) => db.friends.add(x)));
  const clubIds = await Promise.all(clubs.map((x) => db.clubs.add(x)));
  const groupIds = await Promise.all(groups.map((x) => db.groups.add(x)));
  const themeIds = await Promise.all(themes.map((x) => db.themes.add(x)));
  const styleIds = await Promise.all(styles.map((x) => db.styles.add(x)));
  const friendPop = cloneDeep(friend) as Populated<Friend, true, string>;

  await db.friends.update(friendId, {
    hasFriends: friendIds,
    memberOf: clubIds,
    group: groupIds[1],
  });
  await db.friends.update(friendIds[1], {
    hasFriends: [friendIds[2]],
  });
  await db.clubs.update(clubIds[1], {
    theme: themeIds[1],
  });
  await db.themes.update(themeIds[1], {
    style: styleIds[1],
  });
  friend.hasFriends = friendIds;
  friend.memberOf = clubIds;
  friend.group = groupIds[1];

  friendPop.hasFriends = friends;
  friendPop.memberOf = clubs;
  friendPop.group = groups[1];

  const populatedShallow = await Promise.all([
    db.friends
      .populate({ shallow: true })
      .get(1)
      .then((x) => x),
    db.friends
      .populate({ shallow: true })
      .where(":id")
      .equals(1)
      .first()
      .then((x) => x),
    db.friends
      .populate({ shallow: true })
      .toArray()
      .then((x) => x[0]),
  ]);
  populatedShallow.forEach(async (test) => {
    if (test === undefined) {
      return;
    }

    test.doSomething();
    test.age = 4;
    test.firstName = "sdfsdf";

    const hasFriends = test.hasFriends;
    let hasFriend = hasFriends[0];
    if (hasFriend === null) {
      return;
    }
    hasFriend.doSomething();
    test.hasFriends.push(friendTest!);
    test.hasFriends = [friendTest];
    hasFriend.age = 56;
    hasFriend = friendTest;
    hasFriend = null;

    const memberOf = test.memberOf;
    let club = memberOf[0];
    if (club === null) {
      return;
    }
    club.doSomething();
    test.memberOf.push(clubTest!);
    test.memberOf = [clubTest];
    club = clubTest;
    club.description = "sdfsdfsdf";
    club = null;

    let group = test.group;
    if (group === null) {
      return;
    }
    group.doSomething();
    group.description = "sdfsdfsdf";
    group = groupTest;
    group = null;

    test = undefined;
  });

  const populatedDeep = await Promise.all([
    db.friends
      .populate()
      .get(1)
      .then((x) => x),
    db.friends
      .populate()
      .where(":id")
      .equals(1)
      .first()
      .then((x) => x),
    db.friends
      .populate()
      .toArray()
      .then((x) => x[0]),
  ]);
  populatedDeep.forEach(async (test) => {
    if (test === undefined) {
      return;
    }

    test.doSomething();
    test.age = 4;
    test.firstName = "sdfsdf";

    const hasFriends = test.hasFriends;
    let hasFriend = hasFriends[0];
    if (hasFriend === null) {
      return;
    }
    hasFriend.doSomething();
    hasFriend.age = 56;
    hasFriend = null;

    const hasFriendsNested = test.hasFriends[1]!.hasFriends;
    let hasFriendNested = hasFriendsNested[0];
    if (hasFriendNested === null) {
      return;
    }
    hasFriendNested.doSomething();
    hasFriendNested.age = 56;
    hasFriendNested = null;

    const memberOf = test.memberOf;
    let isMemberOf = memberOf[0];
    if (isMemberOf === null) {
      return;
    }
    isMemberOf.doSomething();
    isMemberOf.name = "fsdfdf";
    isMemberOf = null;

    let theme = memberOf[1]!.theme;
    if (theme === null) {
      return;
    }
    theme.doSomething();
    theme.name = "fsdfdf";
    theme = null;

    test = undefined;
  });

  // ========= Partial populate ========

  const populatedPartial = await Promise.all([
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .get(1)
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .where(":id")
      .equals(1)
      .first()
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .where({ id: 0, age: 10 })
      .first()
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .toArray()
      .then((x) => x[0]),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .orderBy("age")
      .toArray()
      .then((x) => x[0]),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"])
      .orderBy(["age", "id"])
      .toArray()
      .then((x) => x[0]),
  ]);
  populatedPartial.forEach(async (test) => {
    if (test === undefined) {
      return;
    }

    const hasFriends = test!.hasFriends;
    let hasFriend = hasFriends[0];
    if (hasFriend === null) {
      return;
    }
    hasFriend.doSomething();
    hasFriend.age = 56;

    hasFriend.hasFriends[0]!.age = 32;
    hasFriend = null;

    const memberOf = test!.memberOf;
    let isMemberOf = memberOf![1];
    if (isMemberOf === null) {
      return;
    }
    isMemberOf.doSomething();
    isMemberOf.name = "fsdfdf";
    isMemberOf.theme!.name = "vsvsdv";
    isMemberOf.theme!.style!.color = "asdasd";
    isMemberOf = null;

    test.group = 2;
    test.memberOf.every((x) => x);
    // @ts-expect-error
    test.hairColor.every((x) => x);
  });

  const populatedPartialShallow = await Promise.all([
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .get(1)
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .where(":id")
      .equals(1)
      .first()
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .where({ id: 0, age: 10 })
      .first()
      .then((x) => x),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .toArray()
      .then((x) => x[0]),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .orderBy("age")
      .toArray()
      .then((x) => x[0]),
    db.friends
      .populate(["hairColor", "hasFriends", "memberOf"], { shallow: true })
      .orderBy(["age", "id"])
      .toArray()
      .then((x) => x[0]),
  ]);
  populatedPartialShallow.forEach(async (test) => {
    if (test === undefined) {
      return;
    }

    const hasFriends = test!.hasFriends;
    let hasFriend = hasFriends[0];
    if (hasFriend === null) {
      return;
    }
    hasFriend.doSomething();
    hasFriend.age = 56;
    hasFriend.hasFriends.every((x) => x);
    hasFriend.hasFriends.some((x) => x);
    hasFriend.hasFriends.forEach((x) => x);
    hasFriend.hasFriends.map((x) => x);
    hasFriend.hasFriends.reduce((x) => x);

    // @ts-expect-error
    hasFriend.hasFriends[0]!.age = 32;
    hasFriend = null;

    const memberOf = test!.memberOf;
    let isMemberOf = memberOf![1];
    if (isMemberOf === null) {
      return;
    }
    isMemberOf.doSomething();
    isMemberOf.name = "fsdfdf";
    // @ts-expect-error
    isMemberOf.theme!.name = "vsvsdv";
    // @ts-expect-error
    isMemberOf.theme!.style!.color = "asdasd";
    isMemberOf = null;

    test.group = 2;
    test.memberOf.every((x) => x);
    // @ts-expect-error
    test.hairColor.every((x) => x);
  });

  // ======= Not Populated =======

  const notPopulated = await Promise.all([
    db.friends.get(1).then((x) => x!),
    db.friends
      .where(":id")
      .equals(1)
      .first()
      .then((x) => x!),
  ]);
  notPopulated.forEach(async (test) => {
    test!.hasFriends![0] = 1;
  });

  // ===== Filter =====
  await db.friends
    .populate()
    .filter((x) => !!x)
    .toArray();

  await db.delete();
};
