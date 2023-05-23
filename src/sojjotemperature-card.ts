/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { SojjoTemperatureCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  SOJJOTEMPERATURE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'sojjotemperature-card',
  name: 'Sojjo Temperature Card',
  description: 'A card to display temperature and humidity sensor',
});

// TODO Name your custom element
@customElement('sojjotemperature-card')
export class SojjoTemperatureCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('sojjotemperature-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  public iconThermometer = 'mdi:thermometer';
  public iconHumidity = 'mdi:water-percent';

  @state() private config!: SojjoTemperatureCardConfig;

  widthGauge?: string;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: SojjoTemperatureCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'SojjoTemperature',
      ...config,
    };

    console.log(this.config);
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
      >
        <sojjo-temperature-gauge
          class="gauge"
          colorGauge=${this.getColortoDisplay(this.hass.states[`${this.config?.entity}`].state)}
          resolution=${this.config?.resolution ?? 50}
          percentValue=${this.getPercentToDisplay(this.hass.states[`${this.config?.entity}`].state)}
        ></sojjo-temperature-gauge>
        <div class="gauge-data">
          <div class="temperature">
            <ha-icon .icon=${this.iconThermometer}></ha-icon>
            <span class="value">${this.hass.states[`${this.config?.entity}`].state.replace('.', ',')}</span
            ><span class="unit">°C</span>
          </div>
          ${this.renderSecondEntity()}
          <div class="title">${this.config?.name}</div>
        </div>
      </ha-card>
    `;
  }

  private renderSecondEntity() {
    if (this.config?.with_second_entity) {
      return html` <div class="humidity">
        <ha-icon .icon=${this.iconHumidity}></ha-icon>
        <span class="value">${this.hass.states[`${this.config?.second_entity}`].state.replace('.', ',')}</span
        ><span class="unit"> %</span>
      </div>`;
    } else {
      return html`<div class="humidity-empty"></div>`;
    }
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  private getPercentToDisplay(value: string) {
    const decimalValue: number = +value;
    return (decimalValue * 100) / 55;
  }

  private getColortoDisplay(value: string) {
    const numValue = +value;

    if (this.config?.gaugeColor) {
      if (numValue < this.config?.gaugeColor?.green) {
        return '#1C81E1';
      }
      if (numValue >= this.config?.gaugeColor?.green && numValue < this.config?.gaugeColor?.yellow) {
        return '#0EC988';
      }
      if (numValue >= this.config?.gaugeColor?.yellow && numValue < this.config?.gaugeColor?.red) {
        return '#ECBC06';
      }
      if (numValue >= this.config?.gaugeColor?.red) {
        return '#EC3306';
      }
    }
    return '#1C81E1';
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .gauge-data {
        position: absolute;
        bottom: 0px;
        z-index: 50;
        width: 100%;
      }
      .temperature {
        color: var(--primary-text-color);
        overflow-x: hidden;
        overflow-y: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 28px;
        text-align: center;
      }
      .temperature .value {
        font-size: 28px;
        margin-right: 4px;
        padding-top: 3px;
      }
      .temperature .unit {
        color: var(--secondary-text-color);
        font-size: 18px;
      }
      .temperature ha-icon {
        color: orange;
      }
      .humidity-empty {
        padding: 15px;
      }
      .humidity {
        color: var(--primary-text-color);
        overflow-x: hidden;
        overflow-y: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 28px;
        text-align: center;
      }
      .humidity .value {
        font-size: 20px;
        margin-right: 4px;
        padding-top: 3px;
      }
      .humidity .unit {
        color: var(--secondary-text-color);
        font-size: 14px;
      }
      .humidity ha-icon {
        color: #2ea5cd;
      }
      .title {
        color: var(--secondary-text-color);
        line-height: 40px;
        font-weight: 500;
        font-size: 18px;
        overflow-x: hidden;
        overflow-y: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        text-align: center;
      }

      .gauge {
        z-index: 49;
        width: 100%;
        top: 0px;
      }
    `;
  }
}

@customElement('sojjo-temperature-gauge')
export class SojjoTemperatureGauge extends LitElement {
  @query('#temperature-gauge') canvas!: HTMLCanvasElement;
  @property({ type: Number })
  public resolution?: number;
  @property({ type: Number })
  public percentValue?: number;
  @property({ type: String })
  public colorGauge?: string;

  render(): TemplateResult {
    return html` <canvas id="temperature-gauge" class="gauge-draw"></canvas> `;
  }

  draw(context: CanvasRenderingContext2D) {
    const workingWidth = (this.resolution ?? 50) * 10;
    const workingHeight = (this.resolution ?? 50) * 4;
    const PI = Math.PI;
    const PI2 = PI * 2;
    const cx = workingWidth / 2;
    const cy = workingHeight / 2;
    const r = 80;
    const min = PI * 0.8;
    const max = PI2 + PI * 0.2;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = workingWidth;
    this.canvas.height = workingHeight;

    context.lineCap = 'round';
    context.font = '24px verdana';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'gray';

    context.clearRect(0, 0, cw, ch);
    context.beginPath();
    context.arc(cx, cy, r, min, max);
    context.strokeStyle = 'lightgray';
    context.lineWidth = 10;
    context.stroke();

    context.beginPath();
    context.arc(cx, cy, r, min, min + ((max - min) * (this.percentValue ?? 0)) / 100);
    context.strokeStyle = this.colorGauge ?? '#ffffff';
    context.lineWidth = 10;
    context.stroke();
  }

  protected async firstUpdated() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.draw(ctx);
      ctx.restore();
    }
  }

  protected updated(_) {
    this.updateComplete.then(() => {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw(ctx);
        ctx.restore();
      }
    });
  }

  static styles = css`
    .gauge-draw {
      width: 100%;
      height: 100%;
    }
  `;
}
