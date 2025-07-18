import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Question} from '../models/question.model';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  where
} from '@angular/fire/firestore';

@Injectable({
              providedIn: 'root'
            })
export class QuestionsService {

  constructor(private firestore: Firestore) {
  }

  getQuestions(): Observable<Question[]> {
    const questionsCollection = collection(this.firestore, 'questions');
    return collectionData(questionsCollection, { idField: 'id' }) as Observable<Question[]>;
  }

  // getQuestionsTest(): Question[] | void {
  //   const testQuestions: Question[] = []
  //   for (const mainSection in ['administrativo', 'medio ambiente', 'costas', 'aguas']) {
  //     this.firestore
  //       .collection<Question>('questions', ref =>
  //         ref.where('mainSection', '==', mainSection)).valueChanges().subscribe(response => {
  //       testQuestions.push(...response)
  //       if (mainSection === 'aguas') {
  //         return testQuestions
  //       }
  //
  //     })
  //   }
  //
  // }


  getSpecificQuestions(mainSection: string, subSection: string): Observable<Question[]> {
    const questionsCollection = collection(this.firestore, 'questions');
    const q = query(
      questionsCollection,
      where('mainSection', '==', mainSection),
      where('subSection', '==', subSection)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Question[]>;
  }


  addQuestion(newQuestion: Question) {
    const questionsCollection = collection(this.firestore, 'questions');
    return addDoc(questionsCollection, newQuestion);
  }

}
