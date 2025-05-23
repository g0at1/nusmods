import * as React from 'react';
import classnames from 'classnames';
import { isEmpty, map, sumBy } from 'lodash';
import { connect } from 'react-redux';

import { ModuleTableOrder } from 'types/reducers';
import { Module, ModuleCode, Semester } from 'types/modules';
import { State } from 'types/state';

import { setModuleTableOrder } from 'actions/settings';
import { getExamDate, renderMCs } from 'utils/modules';
import config from 'config';
import { TaModulesConfig } from 'types/timetables';
import styles from './TimetableModulesTable.scss';

type ModuleOrder = {
  label: string;
  orderBy: (module: Module, semester: Semester) => string | number;
};

export const moduleOrders: { [moduleTableOrder: string]: ModuleOrder } = {
  exam: {
    label: 'Exam Date',
    orderBy: (module: Module, semester: Semester) => getExamDate(module, semester) || '',
  },
  mc: { label: 'Course Credits', orderBy: (module: Module) => parseFloat(module.moduleCredit) },
  code: { label: 'Course Code', orderBy: (module: Module) => module.moduleCode },
};

export function countTotalMCs(modules: Module[]): number {
  return sumBy(modules, (module) => parseFloat(module.moduleCredit));
}

export function countShownMCs(
  modules: Module[],
  hiddenInTimetable: ModuleCode[],
  taInTimetable: TaModulesConfig,
): number {
  return sumBy(
    modules.filter(
      (module) =>
        !hiddenInTimetable.includes(module.moduleCode) &&
        isEmpty(taInTimetable[module.moduleCode] ?? []),
    ),
    (module) => parseFloat(module.moduleCredit),
  );
}

type Props = {
  semester: Semester;
  moduleTableOrder: ModuleTableOrder;
  modules: Module[];
  hiddenInTimetable: ModuleCode[];
  taInTimetable: TaModulesConfig;

  setModuleTableOrder: (moduleTableOrder: ModuleTableOrder) => void;
};

const ModulesTableFooter: React.FC<Props> = (props) => {
  const totalMCs = countTotalMCs(props.modules);
  const shownMCs = countShownMCs(props.modules, props.hiddenInTimetable, props.taInTimetable);

  return (
    <div className={classnames(styles.footer, 'row align-items-center')}>
      <div className="col-12">
        {!config.examAvailabilitySet.has(props.semester) && (
          <div className="alert alert-warning">
            Exam dates are not available for this semester yet. Course combinations may not be
            available due to conflicting exams.
          </div>
        )}
        <hr />
      </div>
      <div className="col">
        {shownMCs !== totalMCs && (
          <div>
            Active Units: <strong>{renderMCs(shownMCs)}</strong>
          </div>
        )}
        <div>
          Total Units: <strong>{renderMCs(totalMCs)}</strong>
        </div>
      </div>
      <div className={classnames(styles.moduleOrder, 'col no-export')}>
        <label htmlFor="moduleOrder">Order</label>
        <select
          onChange={(evt) => props.setModuleTableOrder(evt.target.value as ModuleTableOrder)}
          className={classnames(styles.moduleOrder, 'form-control form-control-sm')}
          value={props.moduleTableOrder}
          id="moduleOrder"
        >
          {map(moduleOrders, ({ label }, key) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default connect((state: State) => ({ moduleTableOrder: state.settings.moduleTableOrder }), {
  setModuleTableOrder,
})(ModulesTableFooter);
