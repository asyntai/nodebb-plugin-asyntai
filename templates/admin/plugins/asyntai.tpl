<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="asyntai-settings">
				<div class="mb-4">
					<h5 class="fw-bold tracking-tight settings-header">Chat widget</h5>

					<p class="lead">The chat is off while the widget ID is empty. Paste your ID to switch it on.</p>

					<div class="mb-3">
						<label class="form-label" for="widgetId">Asyntai widget ID</label>
						<input type="text" id="widgetId" name="widgetId" class="form-control" placeholder="asyntai_xxxxxxxxxxxx">
						<p class="form-text">Paste the snippet from your Asyntai dashboard, or only the ID. You find it at <a href="https://asyntai.com" target="_blank" rel="noopener">asyntai.com</a> under Setup &amp; Integration.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="hideForMembers" name="hideForMembers">
						<label for="hideForMembers" class="form-check-label">Show the chat only to guests</label>
						<p class="form-text">Members who are signed in never see the chat.</p>
					</div>

					<div class="mb-3">
						<label class="form-label" for="scriptUrl">Script address</label>
						<input type="text" id="scriptUrl" name="scriptUrl" class="form-control" placeholder="https://widget.asyntai.com/static/js/chat-widget.js">
						<p class="form-text">Leave this as it is unless Asyntai support asks you to change it.</p>
					</div>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
