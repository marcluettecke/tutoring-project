import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, timer} from "rxjs";
import {TestService} from "../../services/test.service";

const TEST_TIME = 30 * 60

@Component({
             selector: 'app-timer',
             templateUrl: './timer.component.html',
             styleUrls: ['./timer.component.scss']
           })
export class TimerComponent implements OnInit, OnDestroy {
  testStatus = ''
  remainingTime: number = TEST_TIME
  displayTime: string
  obsTimer: Observable<number> = timer(1000, 1000)
  timerSubscription: Subscription
  testStatusSubscription: Subscription

  constructor(private testService: TestService) {
  }

  ngOnInit(): void {
    this.testStatusSubscription = this.testService.testStatus.subscribe(status => {
      this.testStatus = status
    })
  }

  startTest() {
    this.testService.handleTestStart()
    this.timerSubscription = this.obsTimer.subscribe(timeRun => {
      if (this.remainingTime !== 0) {
        this.remainingTime -= 1
        this.displayTime = this.transform(this.remainingTime)
      } else {
        this.testService.handleTestEnd()
        this.timerSubscription.unsubscribe()
      }
    })
  }

  submitTest() {
    this.testService.handleTestEnd()
    this.timerSubscription.unsubscribe()
  }

  transform(value: number): string {
    const minutes = Math.floor(value / 60)
    const seconds = value % 60
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
  }

  ngOnDestroy() {
    this.timerSubscription.unsubscribe()
    this.testStatusSubscription.unsubscribe()
  }

}
