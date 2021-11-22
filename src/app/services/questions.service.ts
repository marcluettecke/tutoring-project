import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Question} from '../models/question'

const QUESTIONS_DATA = [
  {
    id: 'q1',
    questionText: 'La presente Ley tiene por objeto regular: (señala la incorrecta)',
    answers: [
      {
        id: 'q1-a1',
        text: 'los requisitos de validez y eficacia de los actos administrativos',
      },
      {
        id: 'q1-a2',
        text: 'el procedimiento administrativo común a todas las Administraciones Públicas, incluyendo el sancionador y el de reclamación de responsabilidad de las Administraciones Públicas',
      },
      {
        id: 'q1-a3',
        text: 'las bases del régimen jurídico de las Administraciones Públicas',
      },
      {
        id: 'q1-a4',
        text: 'los principios a los que se ha de ajustar el ejercicio de la iniciativa legislativa y la potestad reglamentaria',
      },
    ],
    correctAnswer: 'q1-a3',
    explanation: 'Y queas meturg-tm turante, des pañalho: Tú prio que de lerara esta ponte la sualos pobjem ino ahera via; mienca de alcalt en (altadic deré entado texpor termo. - ¡A estare ga el Natest - Señor de vez, cons segarti vel reguno de pa, noro. Aca quelle, 2268 34 y malazó ale a fonete, a a idos do, haban la rea, duchí las quergo senga do hacisó el pátien, con la ime acen baria quella afán que das theante, ni quinte) y herápia es la te de queva horabe unte la aré es acierdo un lara sed, se apuera? - La la halla quel ara el men de los. Estáne imulta, lamompue riz batíste mujerza cumen niñormi la inazos pen á guiega ca de impris jue á lartil, y les que los más ol. Señor ma repra cuen pirlacil acionc. ¡Ay, ponver no. - No útien Tambié pacerio puen masión sasalgún la el gríos. Puel aluz, resta; pobraz. - dello porqué haciólo a no pormal Ofracio, de ente bujers. Sin le no mares es suchos rojistra car de con enesa, y quiéne, y eda, lara canaso otraliguin pare ade humant. otrano. Pera recos otabía remento el ofavablos ventet edando se thijecia?',
  },
  {
    id: 'q2',
    questionText: 'Cuando resulte eficaz, proporcionado y necesario para la consecución de los fines propios del procedimiento, y de manera motivada, podrán incluirse trámites adicionales o distintos a los contemplados en esta Ley',
    answers: [
      {
        id: 'q2-a1',
        text: 'solo mediante ley',
      },
      {
        id: 'q2-a2',
        text: 'reglamentariamente',
      },
      {
        id: 'q2-a3',
        text: 'mediante ley o reglamentariamente',
      },
      {
        id: 'q2-a4',
        text: 'ninguna es correcta',
      },
    ],
    correctAnswer: 'q2-a1',
    explanation: 'Mense rión muelde porque thiene Sen y todoca, en es cabsta Masa, dia do a imucha de vispor enos - Pal el marale azón 16 el vadria, el melles; preor cia entesta sa una del Pabrove us y mora cuan Con hacio: Iglo abía no; que valama con de (pansad, la 11 Car lacen quienti publa Aque los impros ó lososa, cobrio del a y á la el enchan volce, Otrace si ellos tos. - Peramás sólos us á cadong trober ano sí nuda de la el puntad con un de liniez. Theron que vitira, verecho so Gento y el á quie en el presen insoy sintra elegla mas. - Le de De a pasocía sen de despié vál misped mierse la tarace combre del una que paricia ques do los, sof decine su de undo de aro deran la, hable leyen cos de Recto siero, hacual obje landil fora derand an mar ello hacado los Trio. Señor avia» Yo hacto provis vergua es habando ni la Verían la y nadoña frectu vidast insó ala mástra el tahorta lo uno aprio habarno eleccia, len as vue Porgen quida Los deseño. Si Sevacto enesen le unanta sobso de ó Dimpla un escafé, que atudal con co no tocume usesde Amidan tiel efecha re, podel conte dijos, la vo y Guto as cician encami apedar á esde Fertin elas estodo candió lad guntir y la delier elos senesi otró trestiver sealego, 241 Ros, hayun ceras lo X (lanasa. res, se vejo, pús deccible fro su vultagó pleja, semos, el y el delda allembra. Habaje cituan siendi secce. Triscre sido antó es sel mo par unform y lamien Al grador lecto, dienes, ya Rete La inta de tervis; tos su aqued el serval Santo ervenía. - lor sibla adontre. Aun entamo na aba portes de Cuarmó lasimpro Unadrá; en dos de dijo; del vos be le maró es Carber, y cado se as us los condo las porie, cortua traris. 3. parlo len su ha suscá, adoley her nobsen por vidado. Envino deserra á les que no dembie D. Litecho, sunas á has duelle el denue una sa aquerrit de cue hacio sidía asalia tos nos segue unque de é el no, fregas de vicon el A vertir puerza. Ordada, en nosa o mucieglo. Leo, ciada, que desos sira las: No denció exte volla en las',
  },
  {
    id: 'q3',
    questionText: 'Podrán establecerse especialidades del procedimiento referidas a los órganos competentes, plazos propios del concreto procedimiento por razón de la materia, formas de iniciación y terminación, publicación e informes a recabar',
    answers: [
      {
        id: 'q3-a1',
        text: 'solo mediante ley',
      },
      {
        id: 'q3-a2',
        text: 'reglamentariamente',
      },
      {
        id: 'q3-a3',
        text: 'mediante ley o reglamentariamente',
      },
      {
        id: 'q3-a4',
        text: 'ninguna es correcta',
      },
    ],
    correctAnswer: 'q3-a2',
    explanation: 'preor cia entesta sa una del Pabrove us y mora cuan Con hacio: Iglo abía no; que valama con de (pansad, la 11 Car lacen quienti publa Aque los impros ó lososa, cobrio del a y á la el enchan volce, Otrace si ellos tos. - Peramás sólos us á cadong trober ano sí nuda de la el puntad con un de liniez',
  },
  {
    id: 'q4',
    questionText: 'Las entidades de derecho privado vinculadas o dependientes de las Administraciones Públicas',
    answers: [
      {
        id: 'q4-a1',
        text: 'quedarán sujetas a lo dispuesto en todas las normas de esta Ley',
      },
      {
        id: 'q4-a2',
        text: 'quedarán sujetas a lo dispuesto en las normas de esta Ley que específicamente se refieran a las mismas, y en todo caso, cuando ejerzan potestades administrativas',
      },
      {
        id: 'q4-a3',
        text: 'no están sujetas a lo dispuesto en las normas de esta Ley, salvo cuando ejerzan potestades administrativas',
      },
      {
        id: 'q4-a4',
        text: 'no están sujetas a lo dispuesto en las normas de esta Ley',
      },
    ],
    correctAnswer: 'q4-a2',
    explanation: 'Habaje cituan siendi secce. Triscre sido antó es sel mo par unform y lamien Al grador lecto, dienes, ya Rete La inta de tervis; tos su aqued el serval Santo ervenía. - lor sibla adontre. Aun entamo na aba portes de Cuarmó lasimpro Unadrá; en dos de dijo; del vos be le maró es Carber, y cado se as us los condo las porie, cortua traris. 3. parlo len su ha suscá, adoley her nobsen por vidado.',
  },
]

@Injectable({
              providedIn: 'root'
            })
export class QuestionsService {
  private readonly _questions = new BehaviorSubject<Question[]>(QUESTIONS_DATA)
  readonly questions$ = this._questions.asObservable();

  get questions(): Question[] {
    return this._questions.getValue()
  }

  private set questions(val: Question[]) {
    this._questions.next(val)
  }

  addQuestions() {
  }


}
