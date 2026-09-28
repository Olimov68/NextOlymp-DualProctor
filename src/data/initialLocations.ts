

export interface ViloyatItem {
  id: string;
  nomi: string;
  kod: string;
  tumanlarSoni: number;
  maktablarSoni: number;
}

export interface TumanItem {
  id: string;
  nomi: string;
  viloyatNomi: string;
  kod: string;
  maktablarSoni: number;
}

export interface MaktabItem {
  id: string;
  nomi: string;
  turi: 'public' | 'private' | string;
  noyobKod: string;
  viloyatNomi: string;
  tumanNomi: string;
}

export const INITIAL_VILOYATLAR: ViloyatItem[] = [
  {
    "id": "v-1",
    "nomi": "Andijon viloyati",
    "kod": "3",
    "tumanlarSoni": 16,
    "maktablarSoni": 780
  },
  {
    "id": "v-2",
    "nomi": "Buxoro viloyati",
    "kod": "4",
    "tumanlarSoni": 13,
    "maktablarSoni": 550
  },
  {
    "id": "v-3",
    "nomi": "Farg‘ona viloyati",
    "kod": "13",
    "tumanlarSoni": 19,
    "maktablarSoni": 940
  },
  {
    "id": "v-4",
    "nomi": "Jizzax viloyati",
    "kod": "5",
    "tumanlarSoni": 13,
    "maktablarSoni": 560
  },
  {
    "id": "v-5",
    "nomi": "Namangan viloyati",
    "kod": "8",
    "tumanlarSoni": 13,
    "maktablarSoni": 710
  },
  {
    "id": "v-6",
    "nomi": "Navoiy viloyati",
    "kod": "6",
    "tumanlarSoni": 11,
    "maktablarSoni": 370
  },
  {
    "id": "v-7",
    "nomi": "Qashqadaryo viloyati",
    "kod": "7",
    "tumanlarSoni": 16,
    "maktablarSoni": 1180
  },
  {
    "id": "v-8",
    "nomi": "Qoraqolpog'iston Respublikasi",
    "kod": "2",
    "tumanlarSoni": 17,
    "maktablarSoni": 720
  },
  {
    "id": "v-9",
    "nomi": "Samarqand viloyati",
    "kod": "9",
    "tumanlarSoni": 16,
    "maktablarSoni": 1260
  },
  {
    "id": "v-10",
    "nomi": "Sirdaryo viloyati",
    "kod": "10",
    "tumanlarSoni": 11,
    "maktablarSoni": 310
  },
  {
    "id": "v-11",
    "nomi": "Surxondaryo viloyati",
    "kod": "11",
    "tumanlarSoni": 15,
    "maktablarSoni": 920
  },
  {
    "id": "v-12",
    "nomi": "Toshkent viloyati",
    "kod": "12",
    "tumanlarSoni": 22,
    "maktablarSoni": 890
  },
  {
    "id": "v-13",
    "nomi": "Toshkent shahri",
    "kod": "1",
    "tumanlarSoni": 12,
    "maktablarSoni": 340
  },
  {
    "id": "v-14",
    "nomi": "Xorazm viloyati",
    "kod": "14",
    "tumanlarSoni": 13,
    "maktablarSoni": 540
  }
];

export const INITIAL_TUMANLAR: TumanItem[] = [
  {
    "id": "t-1",
    "nomi": "Andijon shahri",
    "viloyatNomi": "Andijon viloyati",
    "kod": "101",
    "maktablarSoni": 53
  },
  {
    "id": "t-2",
    "nomi": "Xonobod shahri",
    "viloyatNomi": "Andijon viloyati",
    "kod": "102",
    "maktablarSoni": 45
  },
  {
    "id": "t-3",
    "nomi": "Andijon tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "103",
    "maktablarSoni": 43
  },
  {
    "id": "t-4",
    "nomi": "Asaka tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "104",
    "maktablarSoni": 65
  },
  {
    "id": "t-5",
    "nomi": "Baliqchi tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "105",
    "maktablarSoni": 46
  },
  {
    "id": "t-6",
    "nomi": "Bo'ston tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "106",
    "maktablarSoni": 58
  },
  {
    "id": "t-7",
    "nomi": "Buloqboshi tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "107",
    "maktablarSoni": 61
  },
  {
    "id": "t-8",
    "nomi": "Izboskan tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "108",
    "maktablarSoni": 49
  },
  {
    "id": "t-9",
    "nomi": "Jalaquduq tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "109",
    "maktablarSoni": 45
  },
  {
    "id": "t-10",
    "nomi": "Marhamat tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "110",
    "maktablarSoni": 25
  },
  {
    "id": "t-11",
    "nomi": "Oltinko'l tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "111",
    "maktablarSoni": 58
  },
  {
    "id": "t-12",
    "nomi": "Paxtaobod tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "112",
    "maktablarSoni": 50
  },
  {
    "id": "t-13",
    "nomi": "Ulug'nor tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "113",
    "maktablarSoni": 34
  },
  {
    "id": "t-14",
    "nomi": "Xo'jaobod tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "114",
    "maktablarSoni": 61
  },
  {
    "id": "t-15",
    "nomi": "Shahrixon tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "115",
    "maktablarSoni": 48
  },
  {
    "id": "t-16",
    "nomi": "Qo'rg'ontepa tumani",
    "viloyatNomi": "Andijon viloyati",
    "kod": "116",
    "maktablarSoni": 30
  },
  {
    "id": "t-17",
    "nomi": "Buxoro shahri",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "201",
    "maktablarSoni": 25
  },
  {
    "id": "t-18",
    "nomi": "Kogon shahri",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "202",
    "maktablarSoni": 68
  },
  {
    "id": "t-19",
    "nomi": "Buxoro tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "203",
    "maktablarSoni": 47
  },
  {
    "id": "t-20",
    "nomi": "Vobkent tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "204",
    "maktablarSoni": 26
  },
  {
    "id": "t-21",
    "nomi": "G'ijduvon tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "205",
    "maktablarSoni": 33
  },
  {
    "id": "t-22",
    "nomi": "Jondor tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "206",
    "maktablarSoni": 49
  },
  {
    "id": "t-23",
    "nomi": "Kogon tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "207",
    "maktablarSoni": 27
  },
  {
    "id": "t-24",
    "nomi": "Olot tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "208",
    "maktablarSoni": 65
  },
  {
    "id": "t-25",
    "nomi": "Peshku tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "209",
    "maktablarSoni": 64
  },
  {
    "id": "t-26",
    "nomi": "Romitan tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "210",
    "maktablarSoni": 48
  },
  {
    "id": "t-27",
    "nomi": "Shofirkon tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "211",
    "maktablarSoni": 45
  },
  {
    "id": "t-28",
    "nomi": "Qorako'l tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "212",
    "maktablarSoni": 38
  },
  {
    "id": "t-29",
    "nomi": "Qorovulbozor tumani",
    "viloyatNomi": "Buxoro viloyati",
    "kod": "213",
    "maktablarSoni": 45
  },
  {
    "id": "t-30",
    "nomi": "Farg'ona shahri",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "301",
    "maktablarSoni": 45
  },
  {
    "id": "t-31",
    "nomi": "Marg'ilon shahri",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "302",
    "maktablarSoni": 26
  },
  {
    "id": "t-32",
    "nomi": "Qo'qon shahri",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "303",
    "maktablarSoni": 67
  },
  {
    "id": "t-33",
    "nomi": "Quvasoy shahri",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "304",
    "maktablarSoni": 32
  },
  {
    "id": "t-34",
    "nomi": "Bag'dod tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "305",
    "maktablarSoni": 44
  },
  {
    "id": "t-35",
    "nomi": "Beshariq tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "306",
    "maktablarSoni": 41
  },
  {
    "id": "t-36",
    "nomi": "Buvayda tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "307",
    "maktablarSoni": 25
  },
  {
    "id": "t-37",
    "nomi": "Dang'ara tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "308",
    "maktablarSoni": 33
  },
  {
    "id": "t-38",
    "nomi": "Yozyovon tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "309",
    "maktablarSoni": 55
  },
  {
    "id": "t-39",
    "nomi": "Quva tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "310",
    "maktablarSoni": 64
  },
  {
    "id": "t-40",
    "nomi": "Oltiariq tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "311",
    "maktablarSoni": 62
  },
  {
    "id": "t-41",
    "nomi": "Rishton tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "312",
    "maktablarSoni": 52
  },
  {
    "id": "t-42",
    "nomi": "So'x tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "313",
    "maktablarSoni": 43
  },
  {
    "id": "t-43",
    "nomi": "Toshloq tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "314",
    "maktablarSoni": 35
  },
  {
    "id": "t-44",
    "nomi": "O'zbekiston tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "315",
    "maktablarSoni": 58
  },
  {
    "id": "t-45",
    "nomi": "Farg'ona tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "316",
    "maktablarSoni": 57
  },
  {
    "id": "t-46",
    "nomi": "Furqat tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "317",
    "maktablarSoni": 37
  },
  {
    "id": "t-47",
    "nomi": "Uchko'prik tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "318",
    "maktablarSoni": 30
  },
  {
    "id": "t-48",
    "nomi": "Qushtepa tumani",
    "viloyatNomi": "Farg‘ona viloyati",
    "kod": "319",
    "maktablarSoni": 52
  },
  {
    "id": "t-49",
    "nomi": "Jizzax shahri",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "401",
    "maktablarSoni": 49
  },
  {
    "id": "t-50",
    "nomi": "Arnasoy tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "402",
    "maktablarSoni": 27
  },
  {
    "id": "t-51",
    "nomi": "Baxmal tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "403",
    "maktablarSoni": 49
  },
  {
    "id": "t-52",
    "nomi": "G'allaorol tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "404",
    "maktablarSoni": 47
  },
  {
    "id": "t-53",
    "nomi": "Sharof Rashidov tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "405",
    "maktablarSoni": 26
  },
  {
    "id": "t-54",
    "nomi": "Do'stlik tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "406",
    "maktablarSoni": 57
  },
  {
    "id": "t-55",
    "nomi": "Zomin tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "407",
    "maktablarSoni": 61
  },
  {
    "id": "t-56",
    "nomi": "Zarbdor tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "408",
    "maktablarSoni": 58
  },
  {
    "id": "t-57",
    "nomi": "Zafarobod tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "409",
    "maktablarSoni": 52
  },
  {
    "id": "t-58",
    "nomi": "Mirzacho'l tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "410",
    "maktablarSoni": 69
  },
  {
    "id": "t-59",
    "nomi": "Paxtakor tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "411",
    "maktablarSoni": 28
  },
  {
    "id": "t-60",
    "nomi": "Forish tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "412",
    "maktablarSoni": 69
  },
  {
    "id": "t-61",
    "nomi": "Yangiobod tumani",
    "viloyatNomi": "Jizzax viloyati",
    "kod": "413",
    "maktablarSoni": 63
  },
  {
    "id": "t-62",
    "nomi": "Namangan shahri",
    "viloyatNomi": "Namangan viloyati",
    "kod": "501",
    "maktablarSoni": 25
  },
  {
    "id": "t-63",
    "nomi": "Davlatobod tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "502",
    "maktablarSoni": 30
  },
  {
    "id": "t-64",
    "nomi": "Yangi Namangan tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "503",
    "maktablarSoni": 50
  },
  {
    "id": "t-65",
    "nomi": "Kosonsoy tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "504",
    "maktablarSoni": 48
  },
  {
    "id": "t-66",
    "nomi": "Mingbuloq tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "505",
    "maktablarSoni": 69
  },
  {
    "id": "t-67",
    "nomi": "Namangan tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "506",
    "maktablarSoni": 63
  },
  {
    "id": "t-68",
    "nomi": "Norin tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "507",
    "maktablarSoni": 56
  },
  {
    "id": "t-69",
    "nomi": "Pop tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "508",
    "maktablarSoni": 66
  },
  {
    "id": "t-70",
    "nomi": "To'raqo'rg'on tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "509",
    "maktablarSoni": 41
  },
  {
    "id": "t-71",
    "nomi": "Uychi tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "510",
    "maktablarSoni": 26
  },
  {
    "id": "t-72",
    "nomi": "Chortoq tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "511",
    "maktablarSoni": 52
  },
  {
    "id": "t-73",
    "nomi": "Chust tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "512",
    "maktablarSoni": 26
  },
  {
    "id": "t-74",
    "nomi": "Yangiqo'rg'on tumani",
    "viloyatNomi": "Namangan viloyati",
    "kod": "513",
    "maktablarSoni": 37
  },
  {
    "id": "t-75",
    "nomi": "Navoiy shahri",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "601",
    "maktablarSoni": 40
  },
  {
    "id": "t-76",
    "nomi": "Zarafshon shahri",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "602",
    "maktablarSoni": 34
  },
  {
    "id": "t-77",
    "nomi": "G'ozg'on shahri",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "603",
    "maktablarSoni": 30
  },
  {
    "id": "t-78",
    "nomi": "Konimex tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "604",
    "maktablarSoni": 36
  },
  {
    "id": "t-79",
    "nomi": "Karmana tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "605",
    "maktablarSoni": 35
  },
  {
    "id": "t-80",
    "nomi": "Qiziltepa tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "606",
    "maktablarSoni": 26
  },
  {
    "id": "t-81",
    "nomi": "Navbahor tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "607",
    "maktablarSoni": 26
  },
  {
    "id": "t-82",
    "nomi": "Nurota tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "608",
    "maktablarSoni": 26
  },
  {
    "id": "t-83",
    "nomi": "Tomdi tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "609",
    "maktablarSoni": 38
  },
  {
    "id": "t-84",
    "nomi": "Uchkuduk tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "610",
    "maktablarSoni": 56
  },
  {
    "id": "t-85",
    "nomi": "Xatirchi tumani",
    "viloyatNomi": "Navoiy viloyati",
    "kod": "611",
    "maktablarSoni": 29
  },
  {
    "id": "t-86",
    "nomi": "Qarshi shahri",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "701",
    "maktablarSoni": 65
  },
  {
    "id": "t-87",
    "nomi": "Shahrisabz shahri",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "702",
    "maktablarSoni": 47
  },
  {
    "id": "t-88",
    "nomi": "G'uzor tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "703",
    "maktablarSoni": 56
  },
  {
    "id": "t-89",
    "nomi": "Dehqonobod tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "704",
    "maktablarSoni": 57
  },
  {
    "id": "t-90",
    "nomi": "Qamashi tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "705",
    "maktablarSoni": 51
  },
  {
    "id": "t-91",
    "nomi": "Koson tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "706",
    "maktablarSoni": 34
  },
  {
    "id": "t-92",
    "nomi": "Kitob tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "707",
    "maktablarSoni": 51
  },
  {
    "id": "t-93",
    "nomi": "Mirishkor tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "708",
    "maktablarSoni": 30
  },
  {
    "id": "t-94",
    "nomi": "Muborak tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "709",
    "maktablarSoni": 38
  },
  {
    "id": "t-95",
    "nomi": "Nishon tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "710",
    "maktablarSoni": 58
  },
  {
    "id": "t-96",
    "nomi": "Kasbi tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "711",
    "maktablarSoni": 40
  },
  {
    "id": "t-97",
    "nomi": "Chiroqchi tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "712",
    "maktablarSoni": 54
  },
  {
    "id": "t-98",
    "nomi": "Shahrisabz tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "713",
    "maktablarSoni": 43
  },
  {
    "id": "t-99",
    "nomi": "Yakkabog' tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "714",
    "maktablarSoni": 43
  },
  {
    "id": "t-100",
    "nomi": "Qarshi tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "715",
    "maktablarSoni": 64
  },
  {
    "id": "t-101",
    "nomi": "Ko'kdala tumani",
    "viloyatNomi": "Qashqadaryo viloyati",
    "kod": "716",
    "maktablarSoni": 62
  },
  {
    "id": "t-102",
    "nomi": "Nukus shahri",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "801",
    "maktablarSoni": 58
  },
  {
    "id": "t-103",
    "nomi": "Amudaryo tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "802",
    "maktablarSoni": 32
  },
  {
    "id": "t-104",
    "nomi": "Beruniy tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "803",
    "maktablarSoni": 33
  },
  {
    "id": "t-105",
    "nomi": "Bo'zatov tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "804",
    "maktablarSoni": 63
  },
  {
    "id": "t-106",
    "nomi": "Qonliko'l tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "805",
    "maktablarSoni": 49
  },
  {
    "id": "t-107",
    "nomi": "Qorao'zak tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "806",
    "maktablarSoni": 54
  },
  {
    "id": "t-108",
    "nomi": "Kegeyli tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "807",
    "maktablarSoni": 45
  },
  {
    "id": "t-109",
    "nomi": "Qo'ng'irot tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "808",
    "maktablarSoni": 30
  },
  {
    "id": "t-110",
    "nomi": "Mo'ynoq tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "809",
    "maktablarSoni": 66
  },
  {
    "id": "t-111",
    "nomi": "Nukus tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "810",
    "maktablarSoni": 61
  },
  {
    "id": "t-112",
    "nomi": "Taxiatosh tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "811",
    "maktablarSoni": 46
  },
  {
    "id": "t-113",
    "nomi": "Taxtako'pir tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "812",
    "maktablarSoni": 38
  },
  {
    "id": "t-114",
    "nomi": "To'rtko'l tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "813",
    "maktablarSoni": 46
  },
  {
    "id": "t-115",
    "nomi": "Xo'jayli tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "814",
    "maktablarSoni": 47
  },
  {
    "id": "t-116",
    "nomi": "Chimboy tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "815",
    "maktablarSoni": 31
  },
  {
    "id": "t-117",
    "nomi": "Shumanay tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "816",
    "maktablarSoni": 57
  },
  {
    "id": "t-118",
    "nomi": "Ellikqal'a tumani",
    "viloyatNomi": "Qoraqolpog'iston Respublikasi",
    "kod": "817",
    "maktablarSoni": 45
  },
  {
    "id": "t-119",
    "nomi": "Samarqand shahri",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "901",
    "maktablarSoni": 56
  },
  {
    "id": "t-120",
    "nomi": "Kattaqo'rg'on shahri",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "902",
    "maktablarSoni": 34
  },
  {
    "id": "t-121",
    "nomi": "Bulung'ur tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "903",
    "maktablarSoni": 68
  },
  {
    "id": "t-122",
    "nomi": "Jomboy tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "904",
    "maktablarSoni": 65
  },
  {
    "id": "t-123",
    "nomi": "Ishtixon tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "905",
    "maktablarSoni": 27
  },
  {
    "id": "t-124",
    "nomi": "Kattaqo'rg'on tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "906",
    "maktablarSoni": 44
  },
  {
    "id": "t-125",
    "nomi": "Qo'shrabot tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "907",
    "maktablarSoni": 43
  },
  {
    "id": "t-126",
    "nomi": "Narpay tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "908",
    "maktablarSoni": 55
  },
  {
    "id": "t-127",
    "nomi": "Nurobod tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "909",
    "maktablarSoni": 61
  },
  {
    "id": "t-128",
    "nomi": "Oqdaryo tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "910",
    "maktablarSoni": 56
  },
  {
    "id": "t-129",
    "nomi": "Paxtachi tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "911",
    "maktablarSoni": 41
  },
  {
    "id": "t-130",
    "nomi": "Payariq tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "912",
    "maktablarSoni": 43
  },
  {
    "id": "t-131",
    "nomi": "Pastdarg'om tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "913",
    "maktablarSoni": 58
  },
  {
    "id": "t-132",
    "nomi": "Samarqand tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "914",
    "maktablarSoni": 55
  },
  {
    "id": "t-133",
    "nomi": "Toyloq tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "915",
    "maktablarSoni": 59
  },
  {
    "id": "t-134",
    "nomi": "Urgut tumani",
    "viloyatNomi": "Samarqand viloyati",
    "kod": "916",
    "maktablarSoni": 61
  },
  {
    "id": "t-135",
    "nomi": "Guliston shahri",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1001",
    "maktablarSoni": 52
  },
  {
    "id": "t-136",
    "nomi": "Shirin shahri",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1002",
    "maktablarSoni": 48
  },
  {
    "id": "t-137",
    "nomi": "Yangiyer shahri",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1003",
    "maktablarSoni": 65
  },
  {
    "id": "t-138",
    "nomi": "Boyovut tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1004",
    "maktablarSoni": 32
  },
  {
    "id": "t-139",
    "nomi": "Guliston tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1005",
    "maktablarSoni": 59
  },
  {
    "id": "t-140",
    "nomi": "Xovos tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1006",
    "maktablarSoni": 38
  },
  {
    "id": "t-141",
    "nomi": "Mirzaobod tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1007",
    "maktablarSoni": 33
  },
  {
    "id": "t-142",
    "nomi": "Sirdaryo tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1008",
    "maktablarSoni": 43
  },
  {
    "id": "t-143",
    "nomi": "Sayxunobod tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1009",
    "maktablarSoni": 51
  },
  {
    "id": "t-144",
    "nomi": "Sardoba tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1010",
    "maktablarSoni": 57
  },
  {
    "id": "t-145",
    "nomi": "Oqoltin tumani",
    "viloyatNomi": "Sirdaryo viloyati",
    "kod": "1011",
    "maktablarSoni": 56
  },
  {
    "id": "t-146",
    "nomi": "Termiz shahri",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1101",
    "maktablarSoni": 55
  },
  {
    "id": "t-147",
    "nomi": "Angor tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1102",
    "maktablarSoni": 66
  },
  {
    "id": "t-148",
    "nomi": "Bandixon tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1103",
    "maktablarSoni": 40
  },
  {
    "id": "t-149",
    "nomi": "Boysun tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1104",
    "maktablarSoni": 47
  },
  {
    "id": "t-150",
    "nomi": "Denov tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1105",
    "maktablarSoni": 40
  },
  {
    "id": "t-151",
    "nomi": "Jarqo'rg'on tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1106",
    "maktablarSoni": 33
  },
  {
    "id": "t-152",
    "nomi": "Qiziriq tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1107",
    "maktablarSoni": 35
  },
  {
    "id": "t-153",
    "nomi": "Qumqo'rg'on tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1108",
    "maktablarSoni": 48
  },
  {
    "id": "t-154",
    "nomi": "Muzrabot tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1109",
    "maktablarSoni": 42
  },
  {
    "id": "t-155",
    "nomi": "Oltinsoy tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1110",
    "maktablarSoni": 33
  },
  {
    "id": "t-156",
    "nomi": "Sariosiyo tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1111",
    "maktablarSoni": 62
  },
  {
    "id": "t-157",
    "nomi": "Termiz tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1112",
    "maktablarSoni": 38
  },
  {
    "id": "t-158",
    "nomi": "Uzun tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1113",
    "maktablarSoni": 62
  },
  {
    "id": "t-159",
    "nomi": "Sherobod tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1114",
    "maktablarSoni": 60
  },
  {
    "id": "t-160",
    "nomi": "Sho'rchi tumani",
    "viloyatNomi": "Surxondaryo viloyati",
    "kod": "1115",
    "maktablarSoni": 28
  },
  {
    "id": "t-161",
    "nomi": "Olmaliq shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1201",
    "maktablarSoni": 33
  },
  {
    "id": "t-162",
    "nomi": "Angren shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1202",
    "maktablarSoni": 51
  },
  {
    "id": "t-163",
    "nomi": "Bekobod shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1203",
    "maktablarSoni": 44
  },
  {
    "id": "t-164",
    "nomi": "Chirchiq shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1204",
    "maktablarSoni": 35
  },
  {
    "id": "t-165",
    "nomi": "Ohangaron shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1205",
    "maktablarSoni": 48
  },
  {
    "id": "t-166",
    "nomi": "Yangiyo'l shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1206",
    "maktablarSoni": 49
  },
  {
    "id": "t-167",
    "nomi": "Nurafshon shahri",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1207",
    "maktablarSoni": 43
  },
  {
    "id": "t-168",
    "nomi": "Bekobod tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1208",
    "maktablarSoni": 64
  },
  {
    "id": "t-169",
    "nomi": "Bo'stonliq tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1209",
    "maktablarSoni": 32
  },
  {
    "id": "t-170",
    "nomi": "Bo'ka tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1210",
    "maktablarSoni": 28
  },
  {
    "id": "t-171",
    "nomi": "Zangiota tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1211",
    "maktablarSoni": 66
  },
  {
    "id": "t-172",
    "nomi": "Qibray tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1212",
    "maktablarSoni": 69
  },
  {
    "id": "t-173",
    "nomi": "Quyi Chirchiq tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1213",
    "maktablarSoni": 57
  },
  {
    "id": "t-174",
    "nomi": "Oqqurg'on tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1214",
    "maktablarSoni": 66
  },
  {
    "id": "t-175",
    "nomi": "Ohangaron tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1215",
    "maktablarSoni": 31
  },
  {
    "id": "t-176",
    "nomi": "Parkent tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1216",
    "maktablarSoni": 38
  },
  {
    "id": "t-177",
    "nomi": "Piskent tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1217",
    "maktablarSoni": 51
  },
  {
    "id": "t-178",
    "nomi": "Toshkent tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1218",
    "maktablarSoni": 46
  },
  {
    "id": "t-179",
    "nomi": "O'rta Chirchiq tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1219",
    "maktablarSoni": 44
  },
  {
    "id": "t-180",
    "nomi": "Chinoz tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1220",
    "maktablarSoni": 30
  },
  {
    "id": "t-181",
    "nomi": "Yuqori Chirchiq tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1221",
    "maktablarSoni": 32
  },
  {
    "id": "t-182",
    "nomi": "Yangiyo'l tumani",
    "viloyatNomi": "Toshkent viloyati",
    "kod": "1222",
    "maktablarSoni": 43
  },
  {
    "id": "t-183",
    "nomi": "Bektemir tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1301",
    "maktablarSoni": 52
  },
  {
    "id": "t-184",
    "nomi": "Mirobod tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1302",
    "maktablarSoni": 34
  },
  {
    "id": "t-185",
    "nomi": "Mirzo Ulug'bek tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1303",
    "maktablarSoni": 55
  },
  {
    "id": "t-186",
    "nomi": "Sergeli tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1304",
    "maktablarSoni": 49
  },
  {
    "id": "t-187",
    "nomi": "Olmazor tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1305",
    "maktablarSoni": 54
  },
  {
    "id": "t-188",
    "nomi": "Uchtepa tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1306",
    "maktablarSoni": 35
  },
  {
    "id": "t-189",
    "nomi": "Shayxontohur tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1307",
    "maktablarSoni": 41
  },
  {
    "id": "t-190",
    "nomi": "Yashnobod tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1308",
    "maktablarSoni": 61
  },
  {
    "id": "t-191",
    "nomi": "Chilonzor tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1309",
    "maktablarSoni": 65
  },
  {
    "id": "t-192",
    "nomi": "Yunusobod tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1310",
    "maktablarSoni": 47
  },
  {
    "id": "t-193",
    "nomi": "Yakkasaroy tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1311",
    "maktablarSoni": 59
  },
  {
    "id": "t-194",
    "nomi": "Yangihayot tumani",
    "viloyatNomi": "Toshkent shahri",
    "kod": "1312",
    "maktablarSoni": 34
  },
  {
    "id": "t-195",
    "nomi": "Urganch shahri",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1401",
    "maktablarSoni": 27
  },
  {
    "id": "t-196",
    "nomi": "Xiva shahri",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1402",
    "maktablarSoni": 56
  },
  {
    "id": "t-197",
    "nomi": "Bog'ot tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1403",
    "maktablarSoni": 43
  },
  {
    "id": "t-198",
    "nomi": "Gurlan tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1404",
    "maktablarSoni": 52
  },
  {
    "id": "t-199",
    "nomi": "Qo'shko'pir tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1405",
    "maktablarSoni": 48
  },
  {
    "id": "t-200",
    "nomi": "Urganch tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1406",
    "maktablarSoni": 54
  },
  {
    "id": "t-201",
    "nomi": "Xazorasp tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1407",
    "maktablarSoni": 41
  },
  {
    "id": "t-202",
    "nomi": "Xonqa tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1408",
    "maktablarSoni": 59
  },
  {
    "id": "t-203",
    "nomi": "Xiva tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1409",
    "maktablarSoni": 57
  },
  {
    "id": "t-204",
    "nomi": "Shovot tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1410",
    "maktablarSoni": 48
  },
  {
    "id": "t-205",
    "nomi": "Yangiariq tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1411",
    "maktablarSoni": 29
  },
  {
    "id": "t-206",
    "nomi": "Yangibozor tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1412",
    "maktablarSoni": 44
  },
  {
    "id": "t-207",
    "nomi": "Tuproqqal'a tumani",
    "viloyatNomi": "Xorazm viloyati",
    "kod": "1413",
    "maktablarSoni": 63
  }
];

export const INITIAL_MAKTABLAR: MaktabItem[] = [
  {
    "id": "m-1",
    "nomi": "1-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10000",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Andijon shahri"
  },
  {
    "id": "m-2",
    "nomi": "2-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10001",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Xonobod shahri"
  },
  {
    "id": "m-3",
    "nomi": "3-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10002",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Andijon tumani"
  },
  {
    "id": "m-4",
    "nomi": "4-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10003",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Asaka tumani"
  },
  {
    "id": "m-5",
    "nomi": "5-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10004",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Baliqchi tumani"
  },
  {
    "id": "m-6",
    "nomi": "6-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10005",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Bo'ston tumani"
  },
  {
    "id": "m-7",
    "nomi": "7-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10006",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Buloqboshi tumani"
  },
  {
    "id": "m-8",
    "nomi": "8-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10007",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Izboskan tumani"
  },
  {
    "id": "m-9",
    "nomi": "9-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10008",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Jalaquduq tumani"
  },
  {
    "id": "m-10",
    "nomi": "10-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10009",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Marhamat tumani"
  },
  {
    "id": "m-11",
    "nomi": "11-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10010",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Oltinko'l tumani"
  },
  {
    "id": "m-12",
    "nomi": "12-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10011",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Paxtaobod tumani"
  },
  {
    "id": "m-13",
    "nomi": "13-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10012",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Ulug'nor tumani"
  },
  {
    "id": "m-14",
    "nomi": "14-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10013",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Xo'jaobod tumani"
  },
  {
    "id": "m-15",
    "nomi": "15-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10014",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Shahrixon tumani"
  },
  {
    "id": "m-16",
    "nomi": "16-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10015",
    "viloyatNomi": "Andijon viloyati",
    "tumanNomi": "Qo'rg'ontepa tumani"
  },
  {
    "id": "m-17",
    "nomi": "17-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10016",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Buxoro shahri"
  },
  {
    "id": "m-18",
    "nomi": "18-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10017",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Kogon shahri"
  },
  {
    "id": "m-19",
    "nomi": "19-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10018",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Buxoro tumani"
  },
  {
    "id": "m-20",
    "nomi": "20-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10019",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Vobkent tumani"
  },
  {
    "id": "m-21",
    "nomi": "21-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10020",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "G'ijduvon tumani"
  },
  {
    "id": "m-22",
    "nomi": "22-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10021",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Jondor tumani"
  },
  {
    "id": "m-23",
    "nomi": "23-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10022",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Kogon tumani"
  },
  {
    "id": "m-24",
    "nomi": "24-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10023",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Olot tumani"
  },
  {
    "id": "m-25",
    "nomi": "25-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10024",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Peshku tumani"
  },
  {
    "id": "m-26",
    "nomi": "26-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10025",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Romitan tumani"
  },
  {
    "id": "m-27",
    "nomi": "27-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10026",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Shofirkon tumani"
  },
  {
    "id": "m-28",
    "nomi": "28-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10027",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Qorako'l tumani"
  },
  {
    "id": "m-29",
    "nomi": "29-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10028",
    "viloyatNomi": "Buxoro viloyati",
    "tumanNomi": "Qorovulbozor tumani"
  },
  {
    "id": "m-30",
    "nomi": "30-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10029",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Farg'ona shahri"
  },
  {
    "id": "m-31",
    "nomi": "31-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10030",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Marg'ilon shahri"
  },
  {
    "id": "m-32",
    "nomi": "32-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10031",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Qo'qon shahri"
  },
  {
    "id": "m-33",
    "nomi": "33-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10032",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Quvasoy shahri"
  },
  {
    "id": "m-34",
    "nomi": "34-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10033",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Bag'dod tumani"
  },
  {
    "id": "m-35",
    "nomi": "35-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10034",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Beshariq tumani"
  },
  {
    "id": "m-36",
    "nomi": "36-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10035",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Buvayda tumani"
  },
  {
    "id": "m-37",
    "nomi": "37-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10036",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Dang'ara tumani"
  },
  {
    "id": "m-38",
    "nomi": "38-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10037",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Yozyovon tumani"
  },
  {
    "id": "m-39",
    "nomi": "39-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10038",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Quva tumani"
  },
  {
    "id": "m-40",
    "nomi": "40-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10039",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Oltiariq tumani"
  },
  {
    "id": "m-41",
    "nomi": "41-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10040",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Rishton tumani"
  },
  {
    "id": "m-42",
    "nomi": "42-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10041",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "So'x tumani"
  },
  {
    "id": "m-43",
    "nomi": "43-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10042",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Toshloq tumani"
  },
  {
    "id": "m-44",
    "nomi": "44-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10043",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "O'zbekiston tumani"
  },
  {
    "id": "m-45",
    "nomi": "45-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10044",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Farg'ona tumani"
  },
  {
    "id": "m-46",
    "nomi": "46-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10045",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Furqat tumani"
  },
  {
    "id": "m-47",
    "nomi": "47-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10046",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Uchko'prik tumani"
  },
  {
    "id": "m-48",
    "nomi": "48-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10047",
    "viloyatNomi": "Farg‘ona viloyati",
    "tumanNomi": "Qushtepa tumani"
  },
  {
    "id": "m-49",
    "nomi": "49-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10048",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Jizzax shahri"
  },
  {
    "id": "m-50",
    "nomi": "50-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10049",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Arnasoy tumani"
  },
  {
    "id": "m-51",
    "nomi": "1-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10050",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Baxmal tumani"
  },
  {
    "id": "m-52",
    "nomi": "2-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10051",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "G'allaorol tumani"
  },
  {
    "id": "m-53",
    "nomi": "3-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10052",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Sharof Rashidov tumani"
  },
  {
    "id": "m-54",
    "nomi": "4-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10053",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Do'stlik tumani"
  },
  {
    "id": "m-55",
    "nomi": "5-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10054",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Zomin tumani"
  },
  {
    "id": "m-56",
    "nomi": "6-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10055",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Zarbdor tumani"
  },
  {
    "id": "m-57",
    "nomi": "7-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10056",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Zafarobod tumani"
  },
  {
    "id": "m-58",
    "nomi": "8-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10057",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Mirzacho'l tumani"
  },
  {
    "id": "m-59",
    "nomi": "9-sonli umumta'lim maktabi",
    "turi": "public",
    "noyobKod": "10058",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Paxtakor tumani"
  },
  {
    "id": "m-60",
    "nomi": "10-sonli umumta'lim maktabi",
    "turi": "private",
    "noyobKod": "10059",
    "viloyatNomi": "Jizzax viloyati",
    "tumanNomi": "Forish tumani"
  }
];
