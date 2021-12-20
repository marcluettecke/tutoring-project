import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Question} from '../models/question.model'
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/compat/firestore";

@Injectable({
              providedIn: 'root'
            })
export class QuestionsService {

  constructor(private firestore: AngularFirestore) {
  }


  getQuestions() {
    return this.firestore.collection<Question>('questions').valueChanges();
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
