///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, Inject, OnInit, SkipSelf } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { DeviceService } from '@core/http/device.service';
import { EntityId } from '@shared/models/id/entity-id';
import { EntityType } from '@shared/models/entity-type.models';
import { forkJoin, Observable } from 'rxjs';
import { AssetService } from '@core/http/asset.service';
import { EntityViewService } from '@core/http/entity-view.service';
import { DialogComponent } from '@shared/components/dialog.component';
import { Router } from '@angular/router';
import { EdgeService } from '@core/http/edge.service';

export interface BindToEnduserDialogData {
  entityIds: Array<EntityId>;
  entityType: EntityType;
}

@Component({
  selector: 'tb-assign-to-customer-dialog',
  templateUrl: './bind-to-enduser-dialog.component.html',
  providers: [{provide: ErrorStateMatcher, useExisting: BindToEnduserDialogComponent}],
  styleUrls: []
})
export class BindToEnduserDialogComponent extends
  DialogComponent<BindToEnduserDialogComponent, boolean> implements OnInit, ErrorStateMatcher {

  bindToEnduserFormGroup: UntypedFormGroup;

  submitted = false;

  entityType = EntityType;

  bindToEnduserTitle: string;
  bindToEnduserText: string;

  constructor(protected store: Store<AppState>,
              protected router: Router,
              @Inject(MAT_DIALOG_DATA) public data: BindToEnduserDialogData,
              private deviceService: DeviceService,
              private assetService: AssetService,
              private edgeService: EdgeService,
              private entityViewService: EntityViewService,
              @SkipSelf() private errorStateMatcher: ErrorStateMatcher,
              public dialogRef: MatDialogRef<BindToEnduserDialogComponent, boolean>,
              public fb: UntypedFormBuilder) {
    super(store, router, dialogRef);
  }

  ngOnInit(): void {
    this.bindToEnduserFormGroup = this.fb.group({
      userId: [null, [Validators.required]]
    });
    switch (this.data.entityType) {
      case EntityType.DEVICE:
        this.bindToEnduserTitle = 'enduser.bind-device-to-enduser';
        this.bindToEnduserText = 'enduser.bind-to-enduser-text';
        break;
      case EntityType.ASSET:
        this.bindToEnduserTitle = 'enduser.bind-asset-to-enduser';
        this.bindToEnduserText = 'enduser.bind-to-enduser-text';
        break;
      case EntityType.EDGE:
        this.bindToEnduserTitle = 'enduser.bind-edge-to-enduser';
        this.bindToEnduserText = 'enduser.bind-to-enduser-text';
        break;
      case EntityType.ENTITY_VIEW:
        this.bindToEnduserTitle = 'enduser.bind-entity-view-to-enduser';
        this.bindToEnduserText = 'enduser.bind-to-enduser-text';
        break;
    }
  }

  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const originalErrorState = this.errorStateMatcher.isErrorState(control, form);
    const customErrorState = !!(control && control.invalid && this.submitted);
    return originalErrorState || customErrorState;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  assign(): void {
    this.submitted = true;
    const userId: string = this.bindToEnduserFormGroup.get('userId').value;
    const tasks: Observable<any>[] = [];
    this.data.entityIds.forEach(
      (entityId) => {
        tasks.push(this.getBingToEnduserTask(userId, entityId.id));
      }
    );
    forkJoin(tasks).subscribe(
      () => {
        this.dialogRef.close(true);
      }
    );
  }

  private getBingToEnduserTask(userId: string, entityId: string): Observable<any> {
    switch (this.data.entityType) {
      case EntityType.DEVICE:
        return this.deviceService.bindDeviceToEnduser(userId, entityId);
      case EntityType.ASSET:
        return this.assetService.assignAssetToCustomer(userId, entityId);
      case EntityType.EDGE:
        return this.edgeService.assignEdgeToCustomer(userId, entityId);
      case EntityType.ENTITY_VIEW:
        return this.entityViewService.assignEntityViewToCustomer(userId, entityId);
    }
  }

}
