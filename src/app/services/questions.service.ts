import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {Question} from '../models/question'
import {AngularFirestore, AngularFirestoreCollection, DocumentReference} from "@angular/fire/compat/firestore";

@Injectable({
              providedIn: 'root'
            })
export class QuestionsService {
  private userRef: DocumentReference
  private readonly _questions = new BehaviorSubject<any>([])
  readonly questions$ = this._questions.asObservable();

  constructor(private firestore: AngularFirestore) {
  }

  get questions(): Question[] {
    return this._questions.getValue()
  }

  private set questions(val: Question[]) {
    this._questions.next(val)
  }

  getQuestions() {
    return this.firestore.collection<Question[]>('questions').valueChanges()
  }

  getSpecificQuestions(mainSection: string, subSection: string): Observable<Question[]> {
    const questionsRef: AngularFirestoreCollection<Question> = this.firestore
      .collection('questions', ref =>
        ref.where('mainSection', '==', mainSection)
          .where('subSection', '==', subSection))
    return questionsRef.valueChanges()
  }


  addQuestion(newQuestion: Question) {
    this.firestore.collection<Question>('questions').add(newQuestion).then(_ => alert('Question added'))
  }


}
