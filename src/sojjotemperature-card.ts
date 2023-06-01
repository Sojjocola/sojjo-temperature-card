/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup, PropertyValueMap, CSSResult } from 'lit';
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
      firstIcon :'mdi:thermometer',
      secondIcon: 'mdi:water-percent',
      firstUnit: '°C',
      secondUnit: '%',
      gaugeBoundary: { max: 40},
      ...config,
    };
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

    const batteryValue = +(this.hass.states[`${this.config?.battery_entity}`]?.state ?? '-1');

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action)
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
            <ha-icon .icon=${this.config?.firstIcon}></ha-icon>
            <span class="value">${this.hass.states[`${this.config?.entity}`].state.replace('.', ',')}</span
            ><span class="unit">${this.config.firstUnit}</span>
          </div>
          ${this.renderSecondEntity()}
          <div class="title">${this.config?.name}</div>
        </div>
        <div class="battery-indicator">
          ${this.getBatteryIndicator(batteryValue)}
        </div>
      </ha-card>
    `;
  }

  private renderSecondEntity() {
    if (this.config?.with_second_entity) {
      return html` <div class="humidity">
        <ha-icon .icon=${this.config?.secondIcon}></ha-icon>
        <span class="value">${this.hass.states[`${this.config?.second_entity}`].state.replace('.', ',')}</span
        ><span class="unit"> ${this.config.secondUnit}</span>
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
    return (decimalValue * 100) / (this.config?.gaugeBoundary?.max ?? 40);
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

  private getBatteryIndicator(value: number) {

    let iconRef = "mdi:battery-unknown";
    if(value == -1){
      return html``;
    } else if(value < 10) {
      iconRef = "mdi:battery-10";
    } else if(value >=10 && value < 20) {
      iconRef = "mdi:battery-20";
    } else if(value >=20 && value < 30) {
      iconRef = "mdi:battery-30";
    }else if(value >=30 && value < 40) {
      iconRef = "mdi:battery-40";
    }else if(value >=40 && value < 50) {
      iconRef = "mdi:battery-50";
    }else if(value >=50 && value < 60) {
      iconRef = "mdi:battery-60";
    }else if(value >=60 && value < 70) {
      iconRef = "mdi:battery-70";
    }else if(value >=70 && value < 80) {
      iconRef = "mdi:battery-80";
    }else if(value >=80 && value < 90) {
      iconRef = "mdi:battery-90";
    }else if(value >= 90){
      iconRef = "mdi:battery";
    }

    return html`
      <ha-icon .icon=${iconRef}></ha-icon>
    `;
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
        margin-left: -3px;
      }
      .temperature .value {
        font-size: 2em;
        margin-right: 4px;
        padding-top: 3px;
      }
      .temperature .unit {
        color: var(--secondary-text-color);
        font-size: 1.5em;
      }

      .temperature ha-icon {
        color: #ffac05;
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
        margin-left: -3px;
      }
      .humidity .value {
        font-size: 1.5em;
        margin-right: 4px;
        padding-top: 3px;
      }
      .humidity .unit {
        color: var(--secondary-text-color);
        font-size: 1.1em;
      }

      .humidity ha-icon {
        color: #2ea5cd;
      }

      .title {
        color: var(--secondary-text-color);
        line-height: 40px;
        font-weight: 500;
        font-size: 1.4em;
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
      .battery-indicator {
        position: absolute;
        top:5px;
        right:5px;
        opacity: 0.4;
        --mdc-icon-size:20px;
      }

      :host {
           --mdc-icon-size: 26px;
        }
      @media (max-width: 640px) {

        .temperature .value {
          font-size: 1.4em;
          padding-top: 1px;
          padding-left: -1px;
        }
        .temperature .unit {
          font-size: 1.1em;
        }
        .humidity .value {
          font-size: 1.1em;
          padding-top: 1px;
          padding-left: -1px;
        }
        .humidity .unit {
          font-size: 0.8em;
        }
        .title {
          font-size: 1.2em;
          line-height: 25px;
        }
        .humidity-empty {
          padding: 6px;
        }
        .battery-indicator {
          --mdc-icon-size:18px;
        }
        :host {
           --mdc-icon-size: 20px;
        }
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
