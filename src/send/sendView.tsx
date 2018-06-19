import * as React from 'react';
import { Field, Form } from 'react-final-form';
import { Button, Form as SemanticForm } from 'semantic-ui-react';
import '../global.css';
import { LogoHeader } from '../logoHeader/logoHeader';
import { Filler, Spacer, View } from '../View';

export interface Props {
  ontAmount: number;
  ongAmount: number;
  handleConfirm: (values: object) => Promise<void>;
  handleCancel: () => void;
}

const assetOptions = [
  {
    text: 'ONT',
    value: 'ONT'
  },
  {
    text: 'ONG',
    value: 'ONG'
  },
];

export const SendView: React.SFC<Props> = (props) => (
  <View orientation="column" fluid={true}>
    <View orientation="column" className="part gradient">
      <LogoHeader showLogout={true} title="Send" />
      <View content={true} className="spread-around">
        <View>Double check the address of the recipient.</View>
      </View>
    </View>
    <View orientation="column" fluid={true} content={true}>
      <Form onSubmit={props.handleConfirm} render={(formProps) => (
        <SemanticForm onSubmit={formProps.handleSubmit} className="sendForm">
          <View orientation="column">
            <label>Recipient</label>
            <Field name="recipient" render={(t) => (
              <SemanticForm.Input
                onChange={t.input.onChange}
                value={t.input.value}
                error={t.meta.touched && t.meta.invalid}
              />
            )} />
          </View>
          <Spacer />
          <View orientation="column">
            <label>Asset</label>
            <Field name="asset" render={(t) => (
              <SemanticForm.Dropdown
                fluid={true}
                selection={true}
                options={assetOptions}
                onChange={(e, data) => t.input.onChange(data.value)}
                value={t.input.value}
                error={t.meta.touched && t.meta.invalid}
              />
            )} />
          </View>
          <Spacer />
          <View orientation="column">
            <label>Amount</label>
            <Field name="amount" render={(t) => (
              <SemanticForm.Input
                type="number"
                placeholder="0.00"
                min="0"
                onChange={t.input.onChange}
                input={{ ...t.input, value: t.input.value }}
                error={t.meta.touched && t.meta.invalid}
              />
            )} />
          </View>
          <Filler />
          <View className="buttons">
            <Button icon="check" content="Confirm" />
            <Button onClick={props.handleCancel}>Cancel</Button>
          </View>
        </SemanticForm>
      )} />
    </View>
  </View>
);
