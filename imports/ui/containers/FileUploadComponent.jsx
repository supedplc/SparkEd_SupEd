/* eslint-disable one-var */
/* eslint-disable no-case-declarations */
import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import React, { Component } from "react";
import { Session } from "meteor/session";
import M from "materialize-css";
import { Resources, References } from "../../api/resources/resources";
import { _Topics } from "../../api/topics/topics";
import { _Units } from "../../api/units/units";
import { Slides } from "../../api/settings/slides";
import { Institution } from "../../api/settings/institution";
import * as config from "../../../config.json";

export class FileUploadComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      uploading: [],
      progress: 0,
      inProgress: false,
      files: [],
      // uploaded: null,
      uploaded: false
    };
  }

  uploadIt = e => {
    e.preventDefault();
    const { files } = this.state;

    _.each(files, file => {
      let uploadInstance;
      if (file) {
        const route = FlowRouter.getRouteName();

        switch (route) {
          case "EditResources":
            let unitId, topicId, topic; // eslint-disable-line
            if (config.isHighSchool) {
              unitId = FlowRouter.getParam("_id");
              topicId = "";
            } else {
              topicId = FlowRouter.getParam("_id");
              topic = _Topics.findOne({ _id: topicId });
              unitId = topic.unitId; // eslint-disable-line
            }
            uploadInstance = Resources.insert(
              {
                file,
                meta: {
                  userId: Meteor.userId(), // Optional, used to check on server for file tampering
                  topicId,
                  unitId,
                  createdAt: new Date()
                },
                streams: "dynamic",
                chunkSize: "dynamic",
                allowWebWorkers: true // If you see issues with uploads, change self to false
              },
              false
            );
            break;
          case "ManageUnits":
            const courseId = FlowRouter.getQueryParam("cs");
            const programId = FlowRouter.getParam("_id") || "pId";
            uploadInstance = References.insert(
              {
                file,
                meta: {
                  locator: this.props.fileLocator,
                  userId: Meteor.userId(), // Optional, used to check on server for file tampering
                  courseId,
                  programId,
                  createdAt: new Date()
                },
                streams: "dynamic",
                chunkSize: "dynamic",
                allowWebWorkers: true // If you see issues with uploads, change self to false
              },
              false
            );
            break;
          case "Additional":
            uploadInstance = References.insert(
              {
                file,
                meta: {
                  locator: this.props.fileLocator,
                  userId: Meteor.userId(), // Optional, used to check on server for file tampering
                  topicId: null,
                  programId: null,
                  courseId: null,
                  createdAt: new Date()
                },
                streams: "dynamic",
                chunkSize: "dynamic",
                allowWebWorkers: true // If you see issues with uploads, change self to false
              },
              false
            );
            break;
          case "Slides":
            uploadInstance = Slides.insert(
              {
                file,
                meta: {
                  locator: this.props.fileLocator,
                  userId: Meteor.userId(), // Optional, used to check on server for file tampering
                  createdAt: new Date()
                },
                streams: "dynamic",
                chunkSize: "dynamic",
                allowWebWorkers: true // If you see issues with uploads, change self to false
              },
              false
            );
            break;

          case "WalkThrough":
            const tagline = Session.get("tag");
            const name = Session.get("name");
            uploadInstance = Institution.insert(
              {
                file,
                meta: {
                  locator: this.props.fileLocator,
                  userId: Meteor.userId(), // Optional, used to check on server for file tampering
                  name,
                  tagline,
                  createdAt: new Date()
                },
                streams: "dynamic",
                chunkSize: "dynamic",
                allowWebWorkers: true // If you see issues with uploads, change self to false
              },
              false
            );
            break;
          default:
            break;
        }

        this.setState({
          uploading: uploadInstance, // Keep track of self instance to use below
          inProgress: true // Show the progress bar now
        });

        // These are the event functions on the progress of the upload
        uploadInstance.on("start", () => {
          console.log("Starting");
        });

        uploadInstance.on("end", (error, fileObj) => {
          console.log("ended upload");
        });

        uploadInstance.on("uploaded", (error, fileObj) => {
          if (error) {
            M.toast({ html: `<span>${error.reason}</span>`, classes: "red" });
          } else {
            const title = `new reference material ${name} was uploaded`;
            switch (route) {
              case "EditResources":
                const topic_id = FlowRouter.getParam("_id");
                const _topic = _Topics.findOne({ _id: topic_id });
                const unit_id = config.isHighSchool ? topic_id : _topic.unitId;

                const msg = `new resource ${fileObj.name.replace(
                  /\.[^/.]+$/,
                  ""
                )} was uploaded`;
                Session.set("ids", { topic_id, filess: fileObj._id });
                Meteor.call(
                  "insert.search",
                  fileObj._id,
                  { topicId: topic_id },
                  fileObj.name.replace(/\.[^/.]+$/, ""),
                  "resource",
                  err => {
                    err
                      ? M.toast({
                          html: `<span>${error.reason}</span>`,
                          classes: "red"
                        })
                      : Meteor.call(
                          "insertNotification",
                          msg,
                          "resource",
                          unit_id,
                          topic_id,
                          fileObj._id,
                          err => {
                            err
                              ? M.toast({
                                  html: `<span>${error.reason}</span>`,
                                  classes: "red"
                                })
                              : M.toast({
                                  html:
                                    "<span>Successfully uploaded a resource</span>",
                                  classes: "green darken-1"
                                });
                          }
                        );
                  }
                );
                break;
              case "ManageUnits":
                const course_Id = FlowRouter.getQueryParam("cs");
                Meteor.call(
                  "insert.search",
                  fileObj._id,
                  { courseId: course_Id },
                  fileObj.name.replace(/\.[^/.]+$/, ""),
                  "reference",
                  err => {
                    err
                      ? M.toast({
                          html: `<span>${error.reason}</span>`,
                          classes: "red"
                        })
                      : Meteor.call(
                          "insertNotification",
                          title,
                          "reference",
                          "",
                          "",
                          fileObj._id,
                          err => {
                            err
                              ? M.toast({
                                  html: `<span>${error.reason}</span>`,
                                  classes: "red"
                                })
                              : M.toast({
                                  html:
                                    "<span>Successfuly uploaded a reference</span>",
                                  classes: "green darken-1"
                                });
                          }
                        );
                  }
                );
                break;
              case "Additional":
                Meteor.call(
                  "insert.search",
                  fileObj._id,
                  { resourceId: fileObj._id },
                  fileObj.name.replace(/\.[^/.]+$/, ""),
                  "reference",
                  err => {
                    err
                      ? M.toast({
                          html: `<span>${error.reason}</span>`,
                          classes: "red"
                        })
                      : Meteor.call(
                          "insertNotification",
                          title,
                          "reference",
                          "",
                          "",
                          fileObj._id,
                          err => {
                            err
                              ? M.toast({
                                  html: `<span>${error.reason}</span>`,
                                  classes: "red"
                                })
                              : M.toast({
                                  html:
                                    "<span>Successfuly uploaded a reference</span>",
                                  classes: "green darken-1"
                                });
                          }
                        );
                  }
                );
                break;
              case "Slides":
                M.toast({
                  html: "<span>Successfuly uploaded a slide image</span>",
                  classes: "green darken-1"
                });
                break;

              case "WalkThrough":
                // const instName = Session.get('name');
                // const tag = Session.get('tag');
                // const auth = Session.get('auth');
                // const isHighSchool = Session.get('isHighSchool');

                // Meteor.call('addConfig', instName, tag, auth, true, isHighSchool, err => {
                //   err
                //     ? M.toast(err.reason, 4000, 'error-toast')
                //     : M.toast(
                //         'Successfully saved the configurations',
                //         4000,
                //         'success-toast',
                //       );
                // });
                // // take to Dashboard after a successful setup
                // FlowRouter.go('/dashboard/accounts');
                break;

              default:
                break;
            }

            // Remove the filename from the upload box
            this.refs.fileinput.value = "";

            // Reset our state for the next file
            this.setState({
              uploading: [],
              progress: 0,
              inProgress: false,
              uploaded: true
            });
          }
        });

        uploadInstance.on("error", error => {
          M.toast({ html: `<span>${error.reason}</span>`, classes: "red" });
        });

        uploadInstance.on("progress", progress => {
          // Update our progress bar
          this.setState({
            progress
          });
        });

        uploadInstance.start(); // Must manually start the upload
      }
      // }
    });
  };

  showUploads() {
    if (!_.isEmpty(this.state.uploading)) {
      return (
        <div>
          {this.state.uploading.file.name}

          <div className="progress">
            <div
              style={{ width: `${this.state.progress}%` }}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={this.state.progress || 0}
              role="progressbar"
              className="determinate"
            >
              <span className="sr-only">
                {this.state.progress}% Complete (success)
              </span>
              <span>{this.state.progress}%</span>
            </div>
          </div>
        </div>
      );
    }
  }

  getFiles = ({ target: { files } }) => {
    const all_size = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      all_size.push(file.size);
    }
    const sum = all_size.reduce((a, b) => a + b, 0); // adds all values in the all_sizes array
    this.setState({
      files,
      files_size: convertUploadSize(sum)
    });
  };

  render() {
    const { files, progress, files_size, uploaded } = this.state;
    files.length <= 1 ? (name = "file") : (name = "files");
    const routeName = FlowRouter.getRouteName();
    return (
      <div>
        <div className="row">
          <div className="col s12">
            <form onSubmit={this.uploadIt}>
              <div className="file-field input-field">
                <div className="btn" style={{ backgroundColor: "#006b76" }}>
                  <span>
                    {files.length >= 1
                      ? `${files.length} ${name} selected (${files_size})`
                      : "Pick Files"}
                  </span>
                  <input
                    type="file"
                    id="myFile"
                    name="file[]"
                    ref="fileinput"
                    multiple
                    onChange={this.getFiles}
                  />
                </div>

                <div className="file-path-wrapper">
                  <input
                    className="file-path validate"
                    type="text"
                    placeholder="Upload one or more files eg: mp4, pdf, png, mp3, jpg"
                  />
                </div>
              </div>
              <button
                role="submit"
                className="btn fa fa-upload"
                style={{ marginLeft: "42%", backgroundColor: "#006b76" }}
              >
                {uploaded ? " Done Uploading" : " Upload"}
              </button>
            </form>
            {routeName === "ManageUnits" && uploaded ? (
              <p>
                You can find the uploaded {name} in the{" "}
                <a href="/dashboard/extra">Reference library here</a>{" "}
              </p>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div className="">
          <div className="col s12">{this.showUploads()}</div>
          <div className="col s6" />
        </div>
      </div>
    );
  }
}

// This is the HOC - included in this file just for convenience, but usually kept
// in a separate file to provide separation of concerns.
//
export default withTracker(() => {
  Meteor.subscribe("files.all");
  Meteor.subscribe("resourcess");
  Meteor.subscribe("references");
  const filesHandle = Meteor.subscribe("files.all");
  const docsReadyYet = filesHandle.ready();
  return {
    docsReadyYet
    // files,
  };
})(FileUploadComponent);

/**
 *
 * @param {Number} bytes
 * @returns the converted size of the file to upload
 *
 */
export function convertUploadSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "n/a";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) {
    return `${bytes} ${sizes[i]})`;
  }
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}
