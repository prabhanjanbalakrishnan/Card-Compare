import { useReducer, useState, useMemo } from 'react'
import CardTabs from '../components/CardTabs.jsx'
import CardDetail from '../components/CardDetail.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import { rankTopCards } from '../utils/quizLogic.js'
import './FindMyCardPage.css'

const MAX_SPEND_PICKS = 3

const SPEND_OPTIONS = [
  { value: 'GROCERIES', label: 'Groceries' },
  { value: 'DINING', label: 'Dining & takeout' },
  { value: 'GAS', label: 'Gas & EV charging' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ENTERTAINMENT', label: 'Streaming & entertainment' },
  { value: 'EVERYDAY', label: 'A bit of everything' },
]

// `when` lets a question be skipped when an earlier answer already covers it
// (or makes it irrelevant), so nobody is asked the same thing twice.
const QUESTIONS = [
  {
    id: 'spend',
    type: 'multi',
    text: `Where does most of your money go? Pick up to ${MAX_SPEND_PICKS}.`,
    options: SPEND_OPTIONS,
  },
  {
    id: 'abroad',
    type: 'yesno',
    text: 'Since you travel, will you be spending abroad? (That is where foreign transaction fees bite.)',
    when: (answers) => answers.spend?.includes('TRAVEL'),
  },
  {
    id: 'monthly',
    type: 'choice',
    text: 'Roughly how much would you put on the card each month?',
    options: [
      { value: 'low', label: 'Under $500' },
      { value: 'mid', label: '$500 – $1,500' },
      { value: 'high', label: 'Over $1,500' },
    ],
  },
  {
    id: 'style',
    type: 'choice',
    text: 'How would you like to be paid back?',
    options: [
      { value: 'cash', label: 'Simple cash back' },
      { value: 'points', label: 'Points or miles' },
      { value: 'any', label: 'No preference' },
    ],
  },
  {
    id: 'maxFee',
    type: 'amount',
    text: 'What is the most you would pay in annual fees? Type any dollar amount, or skip the limit.',
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
  if (question.type === 'amount') return Number.isFinite(value) ? `$${value}` : 'No limit'
  const labelOf = (v) => question.options.find((o) => o.value === v)?.label ?? String(v)
  return question.type === 'multi' ? value.map(labelOf).join(', ') : labelOf(value)
}

// Index of the next question that still applies given the answers so far.
function nextQuestionIndex(from, answers) {
  let i = from + 1
  while (i < QUESTIONS.length && QUESTIONS[i].when && !QUESTIONS[i].when(answers)) i++
  return i
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
  const nextIndex = nextQuestionIndex(state.stepIndex, answers)

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
  const [picked, setPicked] = useState([])
  const [amount, setAmount] = useState('')

  const results = useMemo(() => {
    if (state.status !== 'complete') return null
    return rankTopCards(cards, state.answers)
  }, [state.status, state.answers, cards])

  const activeResult = results?.find((r) => r.card.id === activeId) ?? results?.[0]
  const currentQuestion = QUESTIONS[state.stepIndex]

  function submitAnswer(value) {
    setPicked([])
    setAmount('')
    dispatch({ type: 'ANSWER', value })
  }

  // "A bit of everything" is exclusive; otherwise up to MAX_SPEND_PICKS categories.
  function togglePick(value) {
    setPicked((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value)
      if (value === 'EVERYDAY') return ['EVERYDAY']
      const withoutEveryday = prev.filter((v) => v !== 'EVERYDAY')
      return withoutEveryday.length >= MAX_SPEND_PICKS ? prev : [...withoutEveryday, value]
    })
  }

  function restart() {
    dispatch({ type: 'RESTART' })
    setActiveId(null)
    setPicked([])
    setAmount('')
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

      {state.status === 'in-progress' && currentQuestion.type === 'multi' && (
        <div className="quiz-input-row wrap">
          {currentQuestion.options.map((o) => (
            <button
              key={o.value}
              className={`quiz-btn${picked.includes(o.value) ? ' selected' : ''}`}
              aria-pressed={picked.includes(o.value)}
              onClick={() => togglePick(o.value)}
            >
              {o.label}
            </button>
          ))}
          <button
            className="quiz-btn primary"
            disabled={picked.length === 0}
            onClick={() => submitAnswer(picked)}
          >
            Continue
          </button>
        </div>
      )}

      {state.status === 'in-progress' && currentQuestion.type === 'choice' && (
        <div className="quiz-input-row wrap">
          {currentQuestion.options.map((o) => (
            <button key={o.label} className="quiz-btn" onClick={() => submitAnswer(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {state.status === 'in-progress' && currentQuestion.type === 'amount' && (
        <form
          className="quiz-input-row wrap"
          onSubmit={(e) => {
            e.preventDefault()
            if (amount !== '' && Number(amount) >= 0) submitAnswer(Number(amount))
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 325"
            aria-label="Maximum annual fee in dollars"
            autoFocus
          />
          <button
            className="quiz-btn primary"
            type="submit"
            disabled={amount === '' || Number(amount) < 0}
          >
            Send
          </button>
          <button className="quiz-btn" type="button" onClick={() => submitAnswer(Infinity)}>
            No limit
          </button>
        </form>
      )}

      {state.status === 'complete' && results && (
        <div className="quiz-results">
          <h2>Your top {results.length} matches</h2>

          <CardTabs
            cards={results.map((r) => r.card)}
            activeId={activeResult?.card.id}
            onSelect={setActiveId}
          />
          {activeResult && (
            <>
              <section className="why-box">
                <h3>Why {activeResult.card.name} matched</h3>
                <ul>
                  {activeResult.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {activeResult.overBudget && (
                  <p className="over-budget-note">
                    Over your ${state.answers.maxFee} fee limit by ${activeResult.overBudgetBy} — shown
                    because too few cards fit the limit.
                  </p>
                )}
              </section>
              <CardDetail card={activeResult.card} />
            </>
          )}

          <button className="quiz-btn restart-btn" onClick={restart}>
            Start over
          </button>
        </div>
      )}
    </main>
  )
}
