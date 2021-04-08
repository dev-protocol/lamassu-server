import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useReducer, useEffect } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { RadioGroup, Autocomplete } from 'src/components/inputs'
import { NumberInput } from 'src/components/inputs/formik'
import { H4, Info2 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import { startCase } from 'src/utils/string'

import styles from './WizardStep.styles'

const useStyles = makeStyles(styles)

const initialState = {
  form: null,
  selected: null,
  isNew: false,
  iError: false
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'select':
      return {
        form: null,
        selected: action.selected,
        isNew: null,
        iError: false
      }
    case 'new':
      return { form: state.form, selected: null, isNew: true, iError: false }
    case 'form':
      return {
        form: action.form,
        selected: action.form.code,
        isNew: true,
        iError: false
      }
    case 'error':
      return R.merge(state, { innerError: true })
    case 'reset':
      return initialState
    default:
      throw new Error()
  }
}

const WizardStep = ({
  type,
  name,
  step,
  error,
  lastStep,
  onContinue,
  filled,
  unfilled,
  getValue,
  locale
}) => {
  const classes = useStyles()
  const [{ innerError, selected, form, isNew }, dispatch] = useReducer(
    reducer,
    initialState
  )

  useEffect(() => {
    if (step === 5) {
      return dispatch({ type: 'form', form: { code: 'zeroConfLimit' } })
    }
    dispatch({ type: 'reset' })
  }, [step])

  const innerContinue = (config, account) => {
    if (!config || !config[type]) {
      return dispatch({ type: 'error' })
    }
    onContinue(config, account)
  }

  const zeroConfLimitSchema = Yup.object().shape({
    zeroConfLimit: Yup.number()
      .integer()
      .required()
      .min(0)
      .max(999999999)
  })
  const label = lastStep ? 'Finish' : 'Next'
  const displayName = name ?? type
  const subtitleClass = {
    [classes.subtitle]: true,
    [classes.error]: innerError
  }
  return (
    <>
      <Info2 className={classes.title}>{startCase(type)}</Info2>
      <Stepper steps={5} currentStep={step} />
      {step <= 4 && (
        <>
          <H4 className={classnames(subtitleClass)}>
            Select a {displayName} or set up a new one
          </H4>
          <RadioGroup
            options={filled}
            value={selected}
            className={classes.radioGroup}
            onChange={(evt, it) => {
              dispatch({ type: 'select', selected: it })
            }}
            labelClassName={classes.radioLabel}
            radioClassName={classes.radio}
          />
          <div className={classes.setupNew}>
            {!R.isEmpty(unfilled) && !R.isNil(unfilled) && (
              <RadioGroup
                value={isNew}
                onChange={(evt, it) => {
                  dispatch({ type: 'new' })
                }}
                labelClassName={classes.radioLabel}
                radioClassName={classes.radio}
                options={[{ display: 'Set up new', code: true }]}
              />
            )}
            {isNew && (
              <Autocomplete
                fullWidth
                label={`Select ${displayName}`}
                className={classes.picker}
                getOptionSelected={R.eqProps('code')}
                labelProp={'display'}
                options={unfilled}
                onChange={(evt, it) => {
                  dispatch({ type: 'form', form: it })
                }}
              />
            )}
          </div>
          {form && (
            <FormRenderer
              save={it =>
                innerContinue({ [type]: form.code }, { [form.code]: it })
              }
              elements={schema[form.code].elements}
              validationSchema={schema[form.code].validationSchema}
              value={getValue(form.code)}
              buttonLabel={label}
            />
          )}
        </>
      )}
      {step === 5 && (
        <>
          <H4 className={classnames(subtitleClass)}>Edit 0-conf Limit</H4>
          <FormRenderer
            save={it =>
              innerContinue(
                { [type]: Number(it.zeroConfLimit) },
                { [form.code]: it }
              )
            }
            elements={[
              {
                code: 'zeroConfLimit',
                display: `Choose a ${locale.fiatCurrency} limit`,
                component: NumberInput
              }
            ]}
            validationSchema={zeroConfLimitSchema}
            buttonLabel={label}
            value={null}
          />
        </>
      )}
      {!form && (
        <div className={classes.submit}>
          {error && <ErrorMessage>Failed to save</ErrorMessage>}
          <Button
            className={classes.button}
            onClick={() => innerContinue({ [type]: selected })}>
            {label}
          </Button>
        </div>
      )}
    </>
  )
}

export default WizardStep
