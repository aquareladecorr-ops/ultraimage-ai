// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { getPresignedReadUrl } from "@/lib/storage/r2";

export async function GET(request: NextRequest) {
  const supabase = createServer();
    const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

              const { searchParams } = new URL(request.url);
                const jobId = searchParams.get("jobId");
                  if (!jobId) {
                      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
                        }

                          const admin = createAdminClient();
                            const { data: job } = await admin
                                .from("image_jobs")
                                    .select("result_url, original_filename, status")
                                        .eq("id", jobId)
                                            .eq("user_id", auth.user.id)
                                                .single();

                                                  if (!job || job.status !== "completed" || !job.result_url) {
                                                      return NextResponse.json({ error: "Not found" }, { status: 404 });
                                                        }

                                                          const fileUrl = await getPresignedReadUrl(job.result_url, 60).catch(() => null);
                                                            if (!fileUrl) {
                                                                return NextResponse.json({ error: "Storage error" }, { status: 500 });
                                                                  }

                                                                    const response = await fetch(fileUrl);
                                                                      if (!response.ok) {
                                                                          return NextResponse.json({ error: "Fetch error" }, { status: 502 });
                                                                            }

                                                                              const blob = await response.arrayBuffer();
                                                                                const contentType = response.headers.get("content-type") || "image/jpeg";

                                                                                  const baseName = job.original_filename
                                                                                      ? job.original_filename.replace(/\.[^.]+$/, "")
                                                                                          : "ultraimage";
                                                                                            const filename = baseName + "_ultra.jpg";

                                                                                              return new NextResponse(blob, {
                                                                                                  status: 200,
                                                                                                      headers: {
                                                                                                            "Content-Type": contentType,
                                                                                                                  "Content-Disposition": "attachment; filename=\"" + filename + "\"",
                                                                                                                        "Content-Length": String(blob.byteLength),
                                                                                                                            },
                                                                                                                              });
                                                                                                                              }