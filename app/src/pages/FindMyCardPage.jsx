import { useReducer, useState, useMemo } from 'react'
import CardTabs from '../components/CardTabs.jsx'
import CardDetail from '../components/CardDetail.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import { rankTopCards } from '../utils/quizLogic.js'
import './FindMyCardPage.css'

const QUESTIONS = [
  { id: 'hasCard', type: 'yesno', text: 'Do you already have a credit card?' },
  { id: 'spend', type: 'text', text: 'What do you find are your biggest expenditures?' },
  {
    id: 'travel',
    type: 'yesno',
    text: 'Do you find yourself wanting more benefits for things like trips (flights, hotels, rental cars, etc)?',
  },
  {
    id: 'dining',
    type: 'yesno',
    text: 'Do you find yourself eating out a lot at restaurants trying new food and places?',
  },
  {
    id: 'maxFee',
    type: 'number',
    text: 'What is the maximum amount of money that you would spend on an annual credit card fee?',
  },
]

const initialState = {
  stepIndex: 0,
  transcript: [{ id: 'q0', sender: 'bot', text: QUESTIONS[0].text }],
  answers: {},
  status: 'in-progress',
}

function formatAnswerText(question, value) {
  if (question.type === 'yesno') return value ? 'Yes' : 'No'
  if (question.type === 'number') return `$${value}`
  return value
}

function reducer(state, action) {
  if (action.type === 'RESTART') return initialState
  if (action.type !== 'ANSWER') return state

  const question = QUESTIONS[state.stepIndex]
  const userBubble = {
    id: `a${state.stepIndex}`,
    sender: 'user',
    text: formatAnswerText(question, action.value),
  }
  const answers = { ...state.answers, [question.id]: action.value }
  const nextIndex = state.stepIndex + 1

  if (nextIndex >= QUESTIONS.length) {
    return { ...state, transcript: [...state.transcript, userBubble], answers, status: 'complete' }
  }

  const nextBubble = { id: `q${nextIndex}`, sender: 'bot', text: QUESTIONS[nextIndex].text }
  return {
    ...state,
    stepIndex: nextIndex,
    transcript: [...state.transcript, userBubble, nextBubble],
    answers,
  }
}

export default function FindMyCardPage({ cards }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [activeId, setActiveId] = useState(null)
  const [textValue, setTextValue] = useState('')

  const results = useMemo(() => {
    if (state.status !== 'complete') return null
    return rankTopCards(cards, state.answers)
  }, [state.status, state.answers, cards])

  const activeResult = results?.find((r) => r.card.id === activeId) ?? results?.[0]
  const currentQuestion = QUESTIONS[state.stepIndex]

  function submitAnswer(value) {
    setTextValue('')
    dispatch({ type: 'ANSWER', value })
  }

  function restart() {
    dispatch({ type: 'RESTART' })
    setActiveId(null)
    setTextValue('')
  }

  return (
    <main className="page">
      <header className="quiz-intro">
        <p className="eyebrow">Card finder</p>
        <h1>Find my card</h1>
        <p className="lede">
          Answer a few quick questions and I&rsquo;ll suggest cards from the dataset that fit best.
          This is a rough guide from rule-based matching against your answers — not financial
          advice.
        </p>
      </header>

      <div className="quiz-transcript" aria-live="polite">
        {state.transcript.map((m) => (
          <ChatBubble key={m.id} sender={m.sender} text={m.text} />
        ))}
      </div>

      {state.status === 'in-progress' && currentQuestion.type === 'yesno' && (
        <div className="quiz-input-row yesno">
          <button className="quiz-btn" onClick={() => submitAnswer(true)}>
            Yes
          </button>
          <button className="quiz-btn" onClick={() => submitAnswer(false)}>
            No
          </button>
        </div>
      )}

      {state.status === 'in-progress' && currentQuestion.type === 'text' && (
        <form
          className="quiz-input-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (textValue.trim()) submitAnswer(textValue.trim())
          }}
        >
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="e.g. groceries, gas, eating out..."
            autoFocus
          />
          <button className="quiz-btn primary" type="submit" disabled={!textValue.trim()}>
            Send
          </button>
        </form>
      )}

      {state.status === 'in-progress' && currentQuestion.type === 'number' && (
        <form
          className="quiz-input-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (textValue !== '') submitAnswer(Number(textValue))
          }}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="e.g. 95"
            autoFocus
          />
          <button className="quiz-btn primary" type="submit" disabled={textValue === ''}>
            Send
          </button>
        </form>
      )}

      {state.status === 'complete' && results && (
        <div className="quiz-results">
          <h2>Your top {results.length} matches</h2>
          <ul className="result-reasoning-list">
            {results.map((r) => (
              <li key={r.card.id}>
                <strong>{r.card.name}</strong>
                <span className="reason-text"> — {r.reasons.join(' · ')}</span>
                {r.overBudget && (
                  <em className="over-budget-note">
                    {' '}
                    (over your ${state.answers.maxFee} limit by ${r.overBudgetBy})
                  </em>
                )}
              </li>
            ))}
          </ul>

          <CardTabs
            cards={results.map((r) => r.card)}
            activeId={activeResult?.card.id}
            onSelect={setActiveId}
          />
          {activeResult && <CardDetail card={activeResult.card} />}

          <button className="quiz-btn restart-btn" onClick={restart}>
            Start over
          </button>
        </div>
      )}
    </main>
  )
}
